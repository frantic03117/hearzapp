const swaggerAutogen = require("swagger-autogen")();
const doc = {
    info: {
        title: "RephraseApp Api Collection",
        description: "Auto-generated Swagger documentation",
    },
    host: "localhost:7887",
    schemes: ["http"],
};

const outputFile = "./swagger-output.json"; // Swagger JSON file
const endpointsFiles = ["./rephraseapp.js", "./src/routes/*.js"]; // Entry points
swaggerAutogen(outputFile, endpointsFiles).then(() => {
    require("./rephraseapp.js"); // Start the server after generating docs
})