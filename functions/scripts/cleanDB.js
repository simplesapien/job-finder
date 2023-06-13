function cleanDB(entry, db, el) {
    const today = new Date();
    const date = new Date(entry.date);
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
        db.ref("jobs").child(el.key).remove();
    }
}

module.exports = cleanDB;