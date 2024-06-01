const User = require('../models/user');
const bcrypt = require('bcrypt');

module.exports = {};

module.exports.createUser = async (obj) => {
    const checkEmail = await User.findOne({ email: obj.email });
    if (checkEmail) {
        return null;
    } else {
        const hash = await bcrypt.hash(obj.password, 1);
        obj.password = hash;
        obj.admin = 'false';
    }
    
    return await User.create(obj);
}   

module.exports.getUser = async (email) => {
    return await User.findOne({ email: email });
}

module.exports.updateUserPassword = async (userid, password) => {
    const hash = await bcrypt.hash(password, 1);
    return User.updateOne({ _id: userid } ,{ password: hash });
}