exports.logInfo = (message, data = null) => {
    console.log(`ℹ️ ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
};

exports.logError = (message) => {
    console.error(`🚨 ${message}`);
};
