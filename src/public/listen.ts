import swaggerJsdoc from 'swagger-jsdoc';

export const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.1.0", 
    info: {
      title: "BACK-END TA Express API with Swagger",
      version: "0.1.0",
      description:
        "This is a BACK-END API TA application made with Express and documented with Swagger",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./src/public/swagger/*.yaml"], 
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
