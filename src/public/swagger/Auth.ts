/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: The auth managing API
 */

/**
 * @swagger
 * /api/v1/register:
 *   post:
 *     summary: Create a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Register'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseRegister'
 *       500:
 *         description: Some server error
 */

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseLogin'
 *       500:
 *         description: Some server error
 */

/**
 * @swagger
 * /api/v1/reset-password:
 *   post:
 *     summary: Reset Password user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPassword'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseResetPassword'
 *       500:
 *         description: Some server error
 */


/**
 * @swagger
 * /api/v1/request-reset-password:
 *   post:
 *     summary: Request Token Reset Password
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseResetPasswordRequest'
 *       500:
 *         description: Some server error
 *     security:
 *       - BearerAuth: []
 */

/**
 * @swagger
 * /api/v1/refresh:
 *   post:
 *     summary: Refresh Accses Token User
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseRefreshToken'
 *       500:
 *         description: Some server error
 *     security:
 *       - BearerAuth: []
 */

/**
 * @swagger
 * /api/v1/logout:
 *   post:
 *     summary: Logout User
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseLogout'
 *       500:
 *         description: Some server error
 *     security:
 *       - BearerAuth: []
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     Register:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - password_confirmation
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the user
 *         password:
 *           type: string
 *           description: The password for the user account
 *         password_confirmation:
 *           type: string
 *           description: Password confirmation to match the password field
 *       example:
 *         name: John Doe
 *         email: johndoe@email.com
 *         password: password123
 *         password_confirmation: password123
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ResetPassword:
 *       type: object
 *       required:
 *         - password
 *         - password_confirmation
 *       properties:
 *         password:
 *           type: string
 *           description: The password for the user account
 *         password_confirmation:
 *           type: string
 *           description: Password confirmation to match the password field
 *       example:
 *         password: password123
 *         password_confirmation: password123
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Login:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the user
 *         password:
 *           type: string
 *           description: The password for the user account
 *       example:
 *         email: johndoe@email.com
 *         password: password123
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ResponseRegister:
 *       type: object
 *       required:
 *         - success
 *         - data
 *         - message
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates whether the request was successful
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             password:
 *               type: string
 *         message:
 *           type: string
 *       example:
 *         status: true
 *         data:
 *           id: "1"
 *           name: John Doe
 *           email: johndoe@email.com
 *           password: hashedPassword#
 *         message: Register successfully...
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ResponseLogin:
 *       type: object
 *       required:
 *         - success
 *         - data
 *         - message
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates whether the request was successful
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             password:
 *               type: string
 *             token:
 *               type: string
 *         message:
 *           type: string
 *       example:
 *         status: true
 *         data:
 *           id: "1"
 *           name: John Doe
 *           email: johndoe@email.com
 *           password: hashedPassword#
 *           token: token#
 *         message: Login successfully...
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ResponseResetPassword:
 *       type: object
 *       required:
 *         - success
 *         - data
 *         - message
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates whether the request was successful
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             password:
 *               type: string
 *             token:
 *               type: string
 *         message:
 *           type: string
 *       example:
 *         status: true
 *         data:
 *           id: "1"
 *           email: johndoe@email.com
 *           password: hashedPassword#
 *           token: resetPasswordToken#
 *         message: Success Reset Password User...
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ResponseResetPasswordRequest:
 *       type: object
 *       required:
 *         - success
 *         - data
 *         - message
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates whether the request was successful
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *         message:
 *           type: string
 *       example:
 *         status: true
 *         data:
 *           token: resetPasswordToken#
 *         message: Success Created Password reset token...
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ResponseRefreshToken:
 *       type: object
 *       required:
 *         - success
 *         - data
 *         - message
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates whether the request was successful
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *         message:
 *           type: string
 *       example:
 *         status: true
 *         data:
 *           accses_token: resetPasswordToken#
 *         message: Success Created Refresh Token...
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ResponseLogout:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates whether the request was successful
 *         message:
 *           type: string
 *       example:
 *         status: true
 *         message: Logged out successfully...
 */
