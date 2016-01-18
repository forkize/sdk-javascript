function FzError(msg, code, err) {
    this.msg = msg;
    this.code = code;
    this.origin = err;
}

module.exports = FzError;