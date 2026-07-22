app.get("/fields", (req, res) => {
  db.all(
    "SELECT * FROM fields ORDER BY name",
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json(rows);
    }
  );
});

app.post("/fields", (req, res) => {
  const { name } = req.body;

  db.run(
    `
    INSERT INTO fields (name)
    VALUES (?)
    `,
    [name],
    function (err) {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json({
        success: true,
        id: this.lastID,
      });
    }
  );
});