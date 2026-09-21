import app from './app';
const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map