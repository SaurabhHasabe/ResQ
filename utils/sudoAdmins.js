const DEFAULT_SUDO_EMAILS = [
    'utkarshkumar.cs18@gmail.com',
    'saurya1729@gmail.com'
];

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function sudoAdminEmails() {
    const extra = String(process.env.SUDO_ADMIN_EMAILS || '')
        .split(',')
        .map(normalizeEmail)
        .filter(Boolean);
    return [...new Set([...DEFAULT_SUDO_EMAILS, ...extra])];
}

function isSudoAdminEmail(email) {
    return sudoAdminEmails().includes(normalizeEmail(email));
}

async function promoteSudoAdmin(user) {
    if (!user || !isSudoAdminEmail(user.email)) return user;
    if (user.role === 'admin') return user;
    user.role = 'admin';
    await user.save();
    return user;
}

module.exports = {
    DEFAULT_SUDO_EMAILS,
    sudoAdminEmails,
    isSudoAdminEmail,
    promoteSudoAdmin
};
