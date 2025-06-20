package main

import (
    "encoding/json"
    "fmt"
    "log"
    "os"
    "strconv"

    "github.com/gofiber/fiber/v2"
    fabsdkconfig "github.com/hyperledger/fabric-sdk-go/pkg/core/config"
    "github.com/hyperledger/fabric-sdk-go/pkg/gateway"
    "github.com/joho/godotenv"

    "evidence-api/api/config"
)

// APIHandler struct
type APIHandler struct {
    Contract *gateway.Contract
}

// EvidenceRequest struct for JSON input
type EvidenceRequest struct {
    Name               string `json:"name"`
    Description        string `json:"description"`
    CaseID             string `json:"caseId"`
    CollectedBy        string `json:"collectedBy"`
    CollectionTimestamp string `json:"collectionTimestamp"`
    Location           string `json:"location"`
    CID                string `json:"cid"`
    FileSize           int64  `json:"fileSize"`
    FileType           string `json:"fileType"`
    Checksum           string `json:"checksum"`
    PasswordProtected  bool   `json:"passwordProtected"`
}

// Connect to Hyperledger Fabric Gateway
func connectGateway() (*gateway.Contract, error) {
    walletPath, connectionPath, channelName, err := config.LoadConfig()
    if err != nil {
        return nil, fmt.Errorf("failed to load config: %v", err)
    }

    if _, err := os.Stat(connectionPath); os.IsNotExist(err) {
        log.Println("Connection file not found, generating...")
        err = config.Generate()
        if err != nil {
            return nil, fmt.Errorf("failed to generate connection profile: %v", err)
        }
    }

    wallet, err := gateway.NewFileSystemWallet(walletPath)
    if err != nil {
        return nil, fmt.Errorf("failed to create wallet: %v", err)
    }

    user := os.Getenv("FABRIC_USER")
    if user == "" {
        user = "appUser"
    }

    if !wallet.Exists(user) {
        return nil, fmt.Errorf("identity %s not found in wallet, run setup script first", user)
    }

    gw, err := gateway.Connect(
        gateway.WithConfig(fabsdkconfig.FromFile(connectionPath)),
        gateway.WithIdentity(wallet, user),
    )
    if err != nil {
        return nil, fmt.Errorf("failed to connect to gateway: %v", err)
    }

    network, err := gw.GetNetwork(channelName)
    if err != nil {
        return nil, fmt.Errorf("failed to get network: %v", err)
    }

    contractName := os.Getenv("CONTRACT_NAME")
    if contractName == "" {
        contractName = "evidencecc"
    }

    return network.GetContract(contractName), nil
}

// Add evidence API endpoint
func (api *APIHandler) AddEvidence(c *fiber.Ctx) error {
    var req EvidenceRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
    }

    result, err := api.Contract.SubmitTransaction("AddEvidence",
        req.Name,
        req.Description,
        req.CaseID,
        req.CollectedBy,
        req.CollectionTimestamp,
        req.Location,
        req.CID,
        strconv.FormatInt(req.FileSize, 10),
        req.Checksum,
        strconv.FormatBool(req.PasswordProtected),
    )
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": err.Error()})
    }

    // Return both CID and transaction hash (result is usually the tx hash)
    return c.JSON(fiber.Map{
        "message": "Evidence added successfully",
        "cid": req.CID,
        "txHash": string(result),
    })
}

// Get evidence API endpoint
// ...existing code...
func (api *APIHandler) GetEvidence(c *fiber.Ctx) error {
    id := c.Params("id")
    response, err := api.Contract.EvaluateTransaction("GetEvidence", id)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": err.Error()})
    }

    log.Printf("Raw chaincode response: %s", string(response)) // <-- Add this line

    var evidence EvidenceRequest
    err = json.Unmarshal(response, &evidence)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Failed to parse response", "raw": string(response)})
    }

    return c.JSON(evidence)
}
// ...existing code...

// Update status API endpoint (you can keep this or adapt it to a more specific logic if needed)
func (api *APIHandler) UpdateStatus(c *fiber.Ctx) error {
    id := c.Params("id")
    var req struct {
        Status string `json:"status"`
    }
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
    }

    _, err := api.Contract.SubmitTransaction("UpdateStatus", id, req.Status)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": err.Error()})
    }

    return c.JSON(fiber.Map{"message": "Status updated successfully"})
}

// Health check endpoint
func (api *APIHandler) HealthCheck(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{
        "status":  "ok",
        "message": "API is running",
    })
}


// Setup API Routes
func setupRoutes(app *fiber.App, api *APIHandler) {
    app.Get("/health", api.HealthCheck) 
    app.Post("/evidence", api.AddEvidence)
    app.Get("/evidence/:id", api.GetEvidence)
    app.Put("/evidence/:id/status", api.UpdateStatus)
}

func main() {
    err := godotenv.Load()
    if err != nil {
        log.Println("Warning: .env file not found, using environment variables")
    }

    if os.Getenv("REGENERATE_CONFIG") == "true" {
        log.Println("Regenerating connection profile...")
        err = config.Generate()
        if err != nil {
            log.Fatalf("Failed to regenerate connection profile: %v", err)
        }
    }

    contract, err := connectGateway()
    if err != nil {
        log.Fatalf("Failed to connect to Fabric: %v", err)
    }

    apiHandler := &APIHandler{Contract: contract}
    app := fiber.New()
    setupRoutes(app, apiHandler)

    port := os.Getenv("API_PORT")
    if port == "" {
        port = "3000"
    }

    log.Printf("Starting API server on port %s...\n", port)
    log.Fatal(app.Listen(":" + port))
}
