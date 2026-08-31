function normalizeIndianMobile(input) {
    if (input == null) return '';
    const digits = String(input).replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits;
}

function isValidIndianMobile(input) {
    const ten = normalizeIndianMobile(input);
    return /^[6-9]\d{9}$/.test(ten);
}

module.exports = { normalizeIndianMobile, isValidIndianMobile };
