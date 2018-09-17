$(() => {
    const app = Sammy('#container', function () {
        this.use('Handlebars', 'hbs');
        // Navigation
        this.get('#/home', getWelcomePage);
        this.get('index.html', getWelcomePage);

        function getWelcomePage(ctx) {
            if (!auth.isAuth()) {
                ctx.isLoggedIn = auth.isAuth();
                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs'
                }).then(function () {
                    this.partial('./templates/welcome-anonymous.hbs');
                });
            } else {
                ctx.redirect('#/catalog');
            }
        }

        this.get('#/register', function (ctx) {
            ctx.isLoggedIn = auth.isAuth();
            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs'
            }).then(function () {
                this.partial('./templates/forms/registerForm.hbs');
            });
        });
        this.get('#/login', function (ctx) {
            ctx.isLoggedIn = auth.isAuth();
            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs'
            }).then(function () {
                this.partial('./templates/forms/loginForm.hbs');
            });
        });

        // User Session
        this.post('#/register', function (ctx) {
            let username = ctx.params.username;
            let password = ctx.params.password;
            let repeatPass = ctx.params.repeatPass;

            if (!/^[A-Za-z]{3,}$/.test(username)) {
                notify.showError("Username must be atleast three symbols");
            } else if (!/^[A-Za-z0-9]{6,}$/.test(password)) {
                notify.showError("Password must be atleast six symbols");
            } else if(password !== repeatPass){
                notify.showError("Passwords must be equal!");
            } else {
                auth.register(username, password)
                    .then(function (userData) {
                        auth.saveSession(userData);
                        notify.showInfo('User registration successful!');
                        ctx.redirect('#/catalog');
                    })
                    .catch(notify.handleError);
            }

        });
        this.post('#/login', function (ctx) {
            let username = ctx.params.username;
            let password = ctx.params.password;

            if (!/^[A-Za-z]{3,}$/.test(username)) {
                notify.showError("Username must be atleast three symbols");
            } else if (!/^[A-Za-z0-9]{6,}$/.test(password)) {
                notify.showError("Password must be atleast six symbols");
            } else {
                auth.login(username, password)
                    .then(function (userData) {
                        auth.saveSession(userData);
                        notify.showInfo('Login successful!');
                        ctx.redirect('#/catalog');
                    })
                    .catch(notify.handleError);
            }
        });

        this.get('#/logout', function (ctx) {
            auth.logout()
                .then(function (data) {
                    sessionStorage.clear();
                    notify.showInfo("Logout successful!");
                    ctx.redirect('#/home');
                });
        });
        
        this.get('#/catalog', function (ctx) {
            service.getAllCars()
                .then(function (cars) {
                    console.log(cars);
                    ctx.username = sessionStorage.getItem('username');
                    cars.forEach((c) => {
                     c.isAuthor = sessionStorage.getItem('username') === c.seller;
                    });
                    ctx.isLoggedIn = auth.isAuth();
                    ctx.cars = cars;

                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        car: './templates/catalog/car.hbs',
                        footer: './templates/common/footer.hbs'
                    }).then(function () {
                        this.partial('./templates/catalog/catalogPage.hbs');
                    });
                })
                .catch(notify.handleError);
        });

        this.get('#/create', function (ctx) {
            ctx.loadPartials({
                header: './templates/common/header.hbs',
                createCarForm: './templates/forms/createCarForm.hbs',
                footer: './templates/common/footer.hbs'
            }).then(function () {
                this.partial('./templates/create/createCarPage.hbs');
            });
        });

        this.post('#/create/car', function (ctx) {
              let title = ctx.params.title;
              let description = ctx.params.description;
              let brand = ctx.params.brand;
              let model = ctx.params.model;
              let year = ctx.params.year;
              let imageUrl = ctx.params.imageUrl;
              let fuel = ctx.params.fuelType;
              let price = ctx.params.price;
              let seller = sessionStorage.getItem('username');
              let regex = /^http/g;

              if (title.length > 33 || title.trim() === ""){
                  notify.showError("Title must be between 1-33 characters!");
              } else if(description.length > 450){
                  notify.showError("Description must be between 1-450 characters!");
              } else if(brand.length > 11 || brand.trim() === "") {
                  notify.showError("Brand must be between 1-11 characters!");
              } else if(fuel.length > 11 || fuel.trim() === ""){
                  notify.showError("Fuel must be between 1-11 characters!");
              } else if(model.length < 4 || model.length > 11 || model.trim() === ""){
                  notify.showError("Model must be between 4-11 characters!");
              } else if(year.trim() === "" || year.length !== 4){
                  notify.showError("Year must be exactly 4 characters long!");
              } else if (price.trim() === ""){
                  notify.showError("Price can not be empty!");
              } else if(Number(price) > 1000000) {
                  notify.showError("Price can not be more than 100000$!");
              } else if(!regex.test(imageUrl)) {
                  notify.showError("The imageUrl must be in valid HTTP format!");
              } else {
                  service.createCar(title, imageUrl, brand, model, fuel, year, price, description, seller)
                      .then(function () {
                          notify.showInfo("Listing created!");
                          ctx.redirect('#/catalog');
                      })
                      .catch(notify.handleError);
              }
        });

        this.get('#/edit/car/:id', function (ctx) {
            let carId = ctx.params.id;

            service.getCar(carId)
                .then(function (car) {
                    ctx.car = car;
                    ctx.username = sessionStorage.getItem('username');
                    ctx.isLoggedIn = auth.isAuth();

                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        editCarForm: './templates/forms/editCarForm.hbs',
                        footer: './templates/common/footer.hbs'
                    }).then(function () {
                        this.partial('./templates/edit/editCarPage.hbs');
                    });
                })
                .catch(notify.handleError);

        });

        this.post('#/edit/car',function (ctx) {
            let carId = ctx.params.carId;
            let title = ctx.params.title;
            let description = ctx.params.description;
            let brand = ctx.params.brand;
            let model = ctx.params.model;
            let year = ctx.params.year;
            let imageUrl = ctx.params.imageUrl;
            let fuel = ctx.params.fuelType;
            let price = ctx.params.price;
            let seller = sessionStorage.getItem('username');
            let regex = /^http/g;

            if (title.length > 33 || title.trim() === ""){
                notify.showError("Title must be between 1-33 characters!");
            } else if(description.length > 450){
                notify.showError("Description must be between 1-450 characters!");
            } else if(brand.length > 11 || brand.trim() === "") {
                notify.showError("Brand must be between 1-11 characters!");
            } else if(fuel.length > 11 || fuel.trim() === ""){
                notify.showError("Fuel must be between 1-11 characters!");
            } else if(model.length < 4 || model.length > 11 || model.trim() === ""){
                notify.showError("Model must be between 4-11 characters!");
            } else if(year.trim() === "" || year.length !== 4){
                notify.showError("Year must be exactly 4 characters long!");
            } else if (price.trim() === ""){
                notify.showError("Price can not be empty!");
            } else if(Number(price) > 1000000) {
                notify.showError("Price can not be more than 100000$!");
            } else if(!regex.test(imageUrl)) {
                notify.showError("The imageUrl must be in valid HTTP format!");
            } else {
                service.editCar(title, imageUrl, brand, model, fuel, year, price, description, seller, carId)
                    .then(function () {
                        notify.showInfo(`Listing ${title} updated!`);
                        ctx.redirect('#/catalog');
                    })
                    .catch(notify.handleError);
            }

        });

        this.get('#/delete/car/:id', function (ctx) {
             let carId = ctx.params.id;
             console.log(carId);
             service.deleteCar(carId)
                 .then(function () {
                     notify.showInfo("Listing deleted!");
                     ctx.redirect('#/catalog');
                 })
                 .catch(notify.handleError);
        });
        
        this.get('#/myCars', function (ctx) {
            let username = sessionStorage.getItem('username');
            service.myCars(username)
                .then(function (cars) {

                    ctx.cars = cars;
                    ctx.username = sessionStorage.getItem('username');
                    ctx.isLoggedIn = auth.isAuth();

                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        myCar: './templates/myCars/myCar.hbs',
                        footer: './templates/common/footer.hbs'
                    }).then(function () {
                        this.partial('./templates/myCars/myCarPage.hbs');
                    });
                })
                .catch(notify.handleError);
        });

        this.get('#/details/:id', function (ctx) {
            let carId = ctx.params.id;
            service.getCar(carId)
                .then(function (car) {
                    car.isAuthor = sessionStorage.getItem('username') === car.seller;
                    ctx.car = car;
                    ctx.username = sessionStorage.getItem('username');
                    ctx.isLoggedIn = auth.isAuth();

                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        detailCar: './templates/details/detailCar.hbs',
                        footer: './templates/common/footer.hbs'
                    }).then(function () {
                        this.partial('./templates/details/detailsPage.hbs');
                    });
                })
                .catch(notify.handleError);

        });

    });
    
    app.run();
});