let service = (function () {

    function getCar(carId) {
        const endPoint = `cars/${carId}`;
        return requester.get('appdata', endPoint, 'Kinvey');
    }

    function getAllCars() {
        const endPoint = `cars?query={}&sort={"_kmd.ect": -1}`;
        return requester.get('appdata', endPoint, 'Kinvey');
    }

    function createCar(title, imageUrl, brand, model, fuel, year, price, description, seller) {
        const endPoint = 'cars';
        let data = {
            title, imageUrl, brand, model, fuel, year, price, description, seller
        };
        return requester.post('appdata', endPoint, 'Kinvey', data);
    }

    function editCar(title, imageUrl, brand, model, fuel, year, price, description, seller, carId) {
        const endPoint = `cars/${carId}`;
        let data = {
            title, imageUrl, brand, model, fuel, year, price, description, seller
        };
        return requester.update('appdata', endPoint, 'Kinvey', data);
    }

    function deleteCar(carId) {
        let endPoint = `cars/${carId}`;
        return requester.remove('appdata', endPoint, 'Kinvey');
    }
    
    function myCars(username) {
        const endPoint = `cars?query={"seller":"${username}"}&sort={"_kmd.ect": -1}`;
        return requester.get('appdata', endPoint, 'Kinvey');
    }

    return {
        getCar,
        getAllCars,
        createCar,
        editCar,
        deleteCar,
        myCars
    }
})();