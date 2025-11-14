exports.createQuery = async (req, res) => {
    try {
        const { name, mobile, city, message } = req.body;
        const newQuery = new Query({ name, mobile, city, message });
        await newQuery.save();
        res.status(201).json({ message: "Query created successfully", query: newQuery });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

exports.getQueries = async (req, res) => {
    try {
        const queries = await Query.find().sort({ createdAt: -1 });
        res.status(200).json({ queries });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
exports.deleteQuery = async (req, res) => {
    try {
        const { id } = req.params;
        await Query.findByIdAndDelete(id);
        res.status(200).json({ message: "Query deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
