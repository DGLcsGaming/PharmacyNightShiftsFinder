var express = require('express');
var users = express.Router();
var database = require('../Database/database');
var cors = require('cors');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt-nodejs');

users.use(cors());

process.env.SECRET_KEY = "dglcsgaming";

users.post('/register', function(req, res) {
    var appData = {
        "error": 1,
        "data": ""
    };
    var userData = {
        "first_name": req.body.first_name,
        "last_name": req.body.last_name,
        "email": req.body.email,
        "tel": req.body.tel,
        "password": bcrypt.hashSync(req.body.password, null, null),
        "registerdate": new Date().toISOString().slice(0,10)
    };

    database.connection.getConnection(function(err, connection) {
        if (err) {
            appData["error"] = 1;
            appData["data"] = "خطأ في الإتصال بقاعدة البيانات, سنقوم بحل المشكلة قريبا, نعتذر على الإزعاج";
            res.status(200).json(appData);
        } else {
            connection.query('SELECT email FROM users WHERE email=?', userData.email, function(err, rows, fields){
                if(rows.length>0){
                    appData.error = 1;
                    appData["data"] = "هذا البريد الإلكتروني مسجل من قبل, يرجى إستخدام بريد إلكتروني آخر";
                    res.status(200).json(appData);
                }else{
                    connection.query('INSERT INTO users SET ?', userData, function(err, UsersRows, fields) {
                        if (!err) {
                            appData.error = 0;
                            appData["data"] = "تم التسجيل بنجاح";
                            res.status(200).json(appData);
                        } else {
                            appData.error = 1;
                            appData["data"] = "حدث خطأ أثناء عملية التسجيل";
                            res.status(200).json(appData);
                        }
                    });
                }
            });
            connection.release();
        }
    });
});

users.post('/login', function(req, res) {
    var appData = {};
    var email = req.body.email || req.query.email;
    var password = req.body.password || req.query.password;
    database.connection.getConnection(function(err, connection) {
        if (err) {
            appData["error"] = 1;
            appData["data"] = "خطأ في الإتصال بقاعدة البيانات, سنقوم بحل المشكلة قريبا, نعتذر على الإزعاج";
            appData["data"] = err;
            res.status(200).json(appData);
        } else {
            connection.query('SELECT * FROM users WHERE email = ?', [email], function(err, UsersRows, fields) {
                if (err) {
                    appData.error = 1;
                    appData["data"] = "حدث خطأ أثناء عملية تسجيل الدخول";
                    res.status(200).json(appData);
                } else {
                    if (UsersRows.length > 0) {
                        if (bcrypt.compareSync(password, UsersRows[0].password)) {
                            let token = jwt.sign({id: UsersRows[0].id, email: UsersRows[0].email, first_name: UsersRows[0].first_name, last_name: UsersRows[0].last_name, last_name: UsersRows[0].tel}, process.env.SECRET_KEY);
                            appData.error = 0;
                            appData["token"] = token;
                            res.status(200).json(appData);
                        } else {
                            appData.error = 1;
                            appData["data"] = "الإيميل أو كلمة السر اللذان أدخلتهما غير صحيحين";
                            res.status(200).json(appData);
                        }
                    } else {
                        appData.error = 1;
                        appData["data"] = "الإيميل أو كلمة السر اللذان أدخلتهما غير صحيحين";
                        res.status(200).json(appData);
                    }
                }
            });
            connection.release();
        }
    });
});

users.post('/addpharmacy', function(req, res) {
    var appData = {};
    var pharmacy = {
        "cityId" : req.body.cityId,
        "name" : req.body.name,
        "lon" : req.body.lon,
        "lat" : req.body.lat,
        "image" : req.body.image
    };

    if (token) {
        try {
            var decoded = jwt.verify(token, process.env.SECRET_KEY);
            if(decoded.email != email){
                appData["error"] = 1;
                appData["data"] = "Unauthorized";
                return res.status(200).json(appData);
            }else{
                database.connection.getConnection(function(err, connection) {
                    if (err) {
                        appData["error"] = 1;
                        appData["data"] = "خطأ في الإتصال بقاعدة البيانات, سنقوم بحل المشكلة قريبا, نعتذر على الإزعاج";
                        res.status(200).json(appData);
                    } else {
                        connection.query('SELECT isadmin FROM users WHERE id=(SELECT users.id FROM users WHERE email=?)', [email], function(err, rows, fields) {
                            if (err) {
                                appData["error"] = 1;
                                appData["data"] = "خطأ في الإتصال بقاعدة البيانات, سنقوم بحل المشكلة قريبا, نعتذر على الإزعاج";
                                res.status(200).json(appData);
                            }else{
                                if(rows.length > 0 && rows[0].isadmin == 1){ 
                                    connection.query('INSERT INTO pharmacy SET ?', pharmacy, function(err, UsersRows, fields) {
                                        if (err) {
                                            appData["error"] = 1;
                                            appData["data"] = "خطأ في الإتصال بقاعدة البيانات, سنقوم بحل المشكلة قريبا, نعتذر على الإزعاج";
                                            res.status(200).json(appData);
                                        } else {
                                            appData["error"] = 0;
                                            appData["data"] = "تم إضافة الصيدلية بنجاح";
                                            res.status(200).json(appData);
                                        }
                                    });
                                }else{
                                    appData["error"] = 1;
                                    appData["data"] = "Unauthorized access";
                                    res.status(200).json(appData);
                                }
                            }
                        });
                        connection.release();
                    }
                });
            }
        } catch (err) {
            appData["error"] = 1;
            appData["data"] = "Token is invalid";
            res.status(200).json(appData);
        }
    }else{
        appData["error"] = 1;
        appData["data"] = "Please send a token";
        res.status(200).json(appData);
    }
});

users.post('/setmoderator', function(req, res) {
    var appData = {};
    var token = req.body.token || req.headers['token'] || req.query.token;
    var email = req.query.email || req.body.email;
    var moderator = {
        "userid": req.body.id || req.query.id,
        "cityId": req.body.cityId || req.query.cityId
    };
    if (token) {
        try {
            var decoded = jwt.verify(token, process.env.SECRET_KEY);
            if(decoded.email != email){
                appData["error"] = 1;
                appData["data"] = "Unauthorized";
                return res.status(200).json(appData);
            }else{
                database.connection.getConnection(function(err, connection) {
                    if (err) {
                        appData["error"] = 1;
                        appData["data"] = "خطأ في الإتصال بقاعدة البيانات, سنقوم بحل المشكلة قريبا, نعتذر على الإزعاج";
                        res.status(200).json(appData);
                    } else {
                        connection.query('SELECT isadmin FROM users WHERE id=(SELECT users.id FROM users WHERE email=?)', [email], function(err, rows, fields) {
                            if (err) {
                                appData["error"] = 1;
                                appData["data"] = "خطأ في الإتصال بقاعدة البيانات, سنقوم بحل المشكلة قريبا, نعتذر على الإزعاج";
                                res.status(200).json(appData);
                            }else{
                                if(rows.length > 0 && rows[0].isadmin == 1){ 
                                    connection.query('INSERT INTO moderators SET ?', moderator, function(err, rows, fields) {
                                        if (err) {
                                            appData["error"] = 1;
                                            appData["data"] = "خطأ في الإتصال بقاعدة البيانات, سنقوم بحل المشكلة قريبا, نعتذر على الإزعاج";
                                            res.status(200).json(appData);
                                        }else{
                                            appData["error"] = 0;
                                            appData["data"] = "تم إضافة المشرف بنجاح";
                                            res.status(200).json(appData);
                                        }
                                    });
                                }else{
                                    appData["error"] = 1;
                                    appData["data"] = "Unauthorized access";
                                    res.status(200).json(appData);
                                }
                            }
                        });
                        connection.release();
                    }
                });
            }
        } catch (err) {
            appData["error"] = 1;
            appData["data"] = "Token is invalid";
            res.status(200).json(appData);
        }
    }else{
        appData["error"] = 1;
        appData["data"] = "Please send a token";
        res.status(200).json(appData);
    }
});

// Usage Guide
users.get('/', function(req, res) {
    var appData = {};

    appData["error"] = 1;
    appData["data"] = "Usage: /pharmacy ,/pharmacies, /shifts";
    res.status(200).json(appData);
});

users.get('/pharmacies', function(req, res) {
    var appData = {};

    appData["error"] = 1;
    appData["data"] = "Usage: /pharmacies/state/<stateId>, /pharmacies/city/<cityId>";
    res.status(200).json(appData);
});

users.get('/pharmacy', function(req, res) {
    var appData = {};

    appData["error"] = 1;
    appData["data"] = "Usage: /pharmacy/<pharmacyId>";
    res.status(200).json(appData);
});

users.get('/shifts', function(req, res) {
    var appData = {};

    appData["error"] = 1;
    appData["data"] = "Usage: /shifts/today/city/<cityId>, /shifts/yesterday/city/<cityId>, /shifts/tomorrow/city/<cityId> | /shifts/today/state/<stateId>, /shifts/yesterday/state/<stateId>, /shifts/tomorrow/state/<stateId>, ";
    res.status(200).json(appData);
});

////Implementation
//Pharmacy Info
users.get('/pharmacy/:pharmacy?', function(req, res) {
    var appData = {};
    var pharmacy = req.params.pharmacy;
    if(pharmacy == null){
        appData["error"] = 1;
        appData["data"] = "pharmacyId is required, Usage: /pharmacy/<pharmacyId>";
        res.status(200).json(appData);
        return;
    }
    database.connection.getConnection(function(err, connection) {
        if (err) {
            appData["error"] = 1;
            appData["data"] = "Error connecting to the database, we will fix the problem shortly.";
            res.status(200).json(appData);
        } else {
            connection.query('SELECT pharmacy.name,pharmacy.lon,pharmacy.lat, pharmacy.image, city.name AS city, state.name AS state FROM pharmacy JOIN city ON city.id=pharmacy.cityId JOIN state ON state.code=city.stateCode WHERE pharmacy.id = ?', [pharmacy], function(err, PharmacyRows, fields) {
                if (err) {
                    appData.error = 1;
                    appData["data"] = err;
                    res.status(200).json(appData);
                } else {
                    appData.error = 0;
                    var data = PharmacyRows;
                    appData["data"] = data;
                    res.status(200).json(appData);
                }
            });
            connection.release();
        }
    });
    
});

//Pharmacies in an area
users.get('/pharmacies/state/:state?', function(req, res) {
    var appData = {};
    var state = req.params.state;
    if(state == null){
        appData["error"] = 1;
        appData["data"] = "stateId is required, Usage: /pharmacies/state/<stateId>";
        res.status(200).json(appData);
        return;
    }
    database.connection.getConnection(function(err, connection) {
        if (err) {
            appData["error"] = 1;
            appData["data"] = "Error connecting to the database, we will fix the problem shortly.";
            res.status(200).json(appData);
        } else {
            connection.query('SELECT pharmacy.name,pharmacy.lon,pharmacy.lat, pharmacy.image, city.name AS city, state.name AS state FROM pharmacy JOIN city ON city.id=pharmacy.cityId JOIN state ON state.code=city.stateCode WHERE state.code=?', [state], function(err, StateRows, fields) {
                if (err) {
                    appData.error = 1;
                    appData["data"] = err;
                    res.status(200).json(appData);
                } else {
                    appData.error = 0;
                    var data = StateRows;
                    appData["data"] = data;
                    res.status(200).json(appData);
                }
            });
            connection.release();
        }
    });
    
});

users.get('/pharmacies/city/:city?', function(req, res) {
    var appData = {};
    var city = req.params.city;
    if(city == null){
        appData["error"] = 1;
        appData["data"] = "cityId is required, Usage: /pharmacies/city/<cityId>";
        res.status(200).json(appData);
        return;
    }
    
    database.connection.getConnection(function(err, connection) {
        if (err) {
            appData["error"] = 1;
            appData["data"] = "Error connecting to the database, we will fix the problem shortly.";
            res.status(200).json(appData);
        } else {
            connection.query('SELECT pharmacy.name,pharmacy.lon,pharmacy.lat, pharmacy.image, city.name AS city, state.name AS state FROM pharmacy JOIN city ON city.id=pharmacy.cityId JOIN state ON state.code=city.stateCode WHERE city.id = ?', [city], function(err, CityRows, fields) {
                if (err) {
                    appData.error = 1;
                    appData["data"] = err;
                    res.status(200).json(appData);
                } else {
                    appData.error = 0;
                    var data = CityRows;
                    appData["data"] = data;
                    res.status(200).json(appData);
                }
            });
            connection.release();
        }
    });
    
});

//Shifts
users.get('/shifts/today/city/:city?', function(req, res) {
    var appData = {};
    var city = req.params.city;
    if(city == null){
        appData["error"] = 1;
        appData["data"] = "cityId is required, Usage: /shifts/today/city/<cityId>";
        res.status(200).json(appData);
        return;
    }
    
    database.connection.getConnection(function(err, connection) {
        if (err) {
            appData["error"] = 1;
            appData["data"] = "Error connecting to the database, we will fix the problem shortly.";
            res.status(200).json(appData);
        } else {
            connection.query('SELECT pharmacy.name AS pharmacy, pharmacy.lon, pharmacy.lat, pharmacy.image, nightshift.date, city.name AS city, state.name AS state FROM pharmacy JOIN nightshift ON nightshift.pharmacyId=pharmacy.id JOIN city ON city.id=pharmacy.cityId JOIN state ON state.code=city.stateCode WHERE city.id = ? AND date=CURRENT_DATE()', [city], function(err, CityRows, fields) {
                if (err) {
                    appData.error = 1;
                    appData["data"] = err;
                    res.status(200).json(appData);
                } else {
                    appData.error = 0;
                    var data = CityRows;
                    appData["data"] = data;
                    res.status(200).json(appData);
                }
            });
            connection.release();
        }
    });
    
});

users.get('/shifts/yesterday/city/:city?', function(req, res) {
    var appData = {};
    var city = req.params.city;
    if(city == null){
        appData["error"] = 1;
        appData["data"] = "cityId is required, Usage: /shifts/yesterday/city/<cityId>";
        res.status(200).json(appData);
        return;
    }
    
    database.connection.getConnection(function(err, connection) {
        if (err) {
            appData["error"] = 1;
            appData["data"] = "Error connecting to the database, we will fix the problem shortly.";
            res.status(200).json(appData);
        } else {
            connection.query('SELECT pharmacy.name AS pharmacy, pharmacy.lon, pharmacy.lat, pharmacy.image, nightshift.date, city.name AS city, state.name AS state FROM pharmacy JOIN nightshift ON nightshift.pharmacyId=pharmacy.id JOIN city ON city.id=pharmacy.cityId JOIN state ON state.code=city.stateCode WHERE city.id = ? AND date=CURRENT_DATE()-1', [city], function(err, CityRows, fields) {
                if (err) {
                    appData.error = 1;
                    appData["data"] = err;
                    res.status(200).json(appData);
                } else {
                    appData.error = 0;
                    var data = CityRows;
                    appData["data"] = data;
                    res.status(200).json(appData);
                }
            });
            connection.release();
        }
    });
    
});

users.get('/shifts/tomorrow/city/:city?', function(req, res) {
    var appData = {};
    var city = req.params.city;
    if(city == null){
        appData["error"] = 1;
        appData["data"] = "cityId is required, Usage: /shifts/tomorrow/city/<cityId>";
        res.status(200).json(appData);
        return;
    }
    
    database.connection.getConnection(function(err, connection) {
        if (err) {
            appData["error"] = 1;
            appData["data"] = "Error connecting to the database, we will fix the problem shortly.";
            res.status(200).json(appData);
        } else {
            connection.query('SELECT pharmacy.name AS pharmacy, pharmacy.lon, pharmacy.lat, pharmacy.image, nightshift.date, city.name AS city, state.name AS state FROM pharmacy JOIN nightshift ON nightshift.pharmacyId=pharmacy.id JOIN city ON city.id=pharmacy.cityId JOIN state ON state.code=city.stateCode WHERE city.id = ? AND date=CURRENT_DATE()+1', [city], function(err, CityRows, fields) {
                if (err) {
                    appData.error = 1;
                    appData["data"] = err;
                    res.status(200).json(appData);
                } else {
                    appData.error = 0;
                    var data = CityRows;
                    appData["data"] = data;
                    res.status(200).json(appData);
                }
            });
            connection.release();
        }
    });
    
});

users.get('/shifts/today/state/:state?', function(req, res) {
    var appData = {};
    var state = req.params.state;
    if(state == null){
        appData["error"] = 1;
        appData["data"] = "stateId is required, Usage: /shifts/today/state/<stateId>";
        res.status(200).json(appData);
        return;
    }
    
    database.connection.getConnection(function(err, connection) {
        if (err) {
            appData["error"] = 1;
            appData["data"] = "Error connecting to the database, we will fix the problem shortly.";
            res.status(200).json(appData);
        } else {
            connection.query('SELECT pharmacy.name AS pharmacy, pharmacy.lon, pharmacy.lat, pharmacy.image, nightshift.date, city.name AS city, state.name AS state FROM pharmacy JOIN nightshift ON nightshift.pharmacyId=pharmacy.id JOIN city ON city.id=pharmacy.cityId JOIN state ON state.code=city.stateCode WHERE state.id = ? AND date=CURRENT_DATE()', [state], function(err, StateRows, fields) {
                if (err) {
                    appData.error = 1;
                    appData["data"] = err;
                    res.status(200).json(appData);
                } else {
                    appData.error = 0;
                    var data = StateRows;
                    appData["data"] = data;
                    res.status(200).json(appData);
                }
            });
            connection.release();
        }
    });
    
});

users.get('/shifts/yesterday/state/:state?', function(req, res) {
    var appData = {};
    var state = req.params.state;
    if(state == null){
        appData["error"] = 1;
        appData["data"] = "stateId is required, Usage: /shifts/yesterday/state/<stateId>";
        res.status(200).json(appData);
        return;
    }
    
    database.connection.getConnection(function(err, connection) {
        if (err) {
            appData["error"] = 1;
            appData["data"] = "Error connecting to the database, we will fix the problem shortly.";
            res.status(200).json(appData);
        } else {
            connection.query('SELECT pharmacy.name AS pharmacy, pharmacy.lon, pharmacy.lat, pharmacy.image, nightshift.date, city.name AS city, state.name AS state FROM pharmacy JOIN nightshift ON nightshift.pharmacyId=pharmacy.id JOIN city ON city.id=pharmacy.cityId JOIN state ON state.code=city.stateCode WHERE state.id = ? AND date=CURRENT_DATE()-1', [state], function(err, StateRows, fields) {
                if (err) {
                    appData.error = 1;
                    appData["data"] = err;
                    res.status(200).json(appData);
                } else {
                    appData.error = 0;
                    var data = StateRows;
                    appData["data"] = data;
                    res.status(200).json(appData);
                }
            });
            connection.release();
        }
    });
    
});

users.get('/shifts/tomorrow/state/:state?', function(req, res) {
    var appData = {};
    var state = req.params.state;
    if(state == null){
        appData["error"] = 1;
        appData["data"] = "stateId is required, Usage: /shifts/tomorrow/state/<stateId>";
        res.status(200).json(appData);
        return;
    }
    
    database.connection.getConnection(function(err, connection) {
        if (err) {
            appData["error"] = 1;
            appData["data"] = "Error connecting to the database, we will fix the problem shortly.";
            res.status(200).json(appData);
        } else {
            connection.query('SELECT pharmacy.name AS pharmacy, pharmacy.lon, pharmacy.lat, pharmacy.image, nightshift.date, city.name AS city, state.name AS state FROM pharmacy JOIN nightshift ON nightshift.pharmacyId=pharmacy.id JOIN city ON city.id=pharmacy.cityId JOIN state ON state.code=city.stateCode WHERE state.id = ? AND date=CURRENT_DATE()+1', [state], function(err, StateRows, fields) {
                if (err) {
                    appData.error = 1;
                    appData["data"] = err;
                    res.status(200).json(appData);
                } else {
                    appData.error = 0;
                    var data = StateRows;
                    appData["data"] = data;
                    res.status(200).json(appData);
                }
            });
            connection.release();
        }
    });
    
});



module.exports = users;