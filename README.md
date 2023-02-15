## `Ecommerce Web App `

This is a Ecommerce application with features:
- ### `Register` : User registers using email/password.
- ### `Login` : User logIn through email and password. Once logged-in, store userId in session.
- ### `Forget Password` : If user forgets password, s/he has to enter their login email, and a reset email will be sent which contains reset link, clicking which you can set your new password.
- ### `Shop` : Shows all Products to general public with pagination. Each page shows 3 products.
- ### `Products` : Shows all Products to general public with pagination. Each page shows 3 products with option to see detailed product page.
- ### `Details`: Shows all details of a product.

Once you are logged-In, you are shown other features as an authenticated Admin user. These are :

- ### `Cart` : User can view products that they add to cart. The option `add to cart` shows in Products, Details as well as Shop page only when user is logged-in. For each product, we have `delete` option, if user no longer wants that product. Each product has info - name , price and quantity. When user clicks `Order Now`, s/he is redirected to `checkout` page, which has all products info. and total amount of all products. If user clicks on `Order` option,s/he is redirected to `stripe` for payment through card. If payment is successful, we are redirected to `Orders` page, otherwise if payment is cancelled, we are redirected back to `checkout` page.
- ### `Orders` : User can see all orders placed by him/her. Info of each order - OrderId, product name, product quantity, and a link to get `invoice` of that order. When invoice link is clicked, a PDF is generated, that contains info - product name, product qty, product price per piece price , and final total amount paid.
- ### `Add Product` : Since authenticated user is also an admin user, s/he can add new products. While adding a product, admin user must provide title, single image (jpeg,png,jpg), price and description. Once `Add Product` is clicked, data of product is stored.
- ### `Admin Products` : This page shows all products that the logged In user has created, and not the ones from other admin users. For each Admin product, s/he is given two options - `Edit` and `Delete`. If admin user chooses to delete any product, that product is permanently deleted. If user chooses to `Edit` product, s/he can edit all fields (title, image, price, description) for that product and click on `Update Product`. On doing so, you will again be redirected to `Admin Products` page, and you can see the updated values for that product.
- ### `Logout` : Finally, a user can logout of his/her account using this option, and you will be redirected to `login` page.

Beside the main functional pages, there are two other pages :

- ### `404` : This is rendered when user tries to go to any endpoint which doesn't exist.
- ### `500` : This is rendered when error is thrown from backend.

## `General Instructions`
- Install Packages

```
yarn
```
- Copy the contents of .env.example to .env , and add your credentials

- Start the Server

```
yarn start
```
## `Tech Stack Used`
- ### `UI` : HTML, CSS, JS, EJS 
- ### `Backend` : NodeJS , Express
- ### `Database` : MongoDb, MySQL
- ### `ORM` : Sequelize,Mongoose
- ### `Parsing Request Bodies` : body-parser, multer
- ### `Validating Request Bodies` : Joi
- ### `Sending Email` : @trycourier/courier
- ### `Generating PDF` : PDFKit
