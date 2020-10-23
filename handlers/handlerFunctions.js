function generateSelf(item, suffix) {
    item.self = ROOT_URL + suffix;
    return item;
}

module.exports = { generateSelf };