const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`SERVER STARTED ON PORT ${PORT} - build v2 admin-fix`);
});
