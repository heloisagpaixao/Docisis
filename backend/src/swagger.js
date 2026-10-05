const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "API Docisis",
    description:
      "Documentação automática da API da Doceria utilizando Swagger Autogen",
    version: "2.4.1",
  },
  host: "localhost:3306",
  schemes: ["http"],
};

const outputFile = "./swagger_output.json";
const endpointsFiles = ["./src/routes/index.js"];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log("Documentação do Swagger gerada com sucesso!");
});