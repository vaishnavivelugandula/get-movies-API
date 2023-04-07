const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

intializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT *
    FROM movie
    ORDER BY movie_id;
    `;
  const movies = await db.all(getMoviesQuery);
  response.send(
    movies.map((eachMovie) => convertDbObjectToResponseObject(eachMovie))
  );
});

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
    INSERT INTO 
      movie (director_id,movie_name,lead_actor)
    VALUES 
      (
        ${directorId},
        "${movieName}",
        "${leadActor}"
      );
      `;
  const dbResponse = await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT 
      *
    FROM 
      movie
    WHERE 
      movie_id=${movieId};
    `;
  const movie = await db.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(movie));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
    UPDATE 
      movie
    SET 
      director_id=${directorId},
      movie_name="${movieName}",
      lead_actor="${leadActor}"
    WHERE 
      movie_id=${movieId};
    `;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM
      movie
    WHERE 
      movie_id=${movieId};
    `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT 
      *
    FROM 
      director
    ORDER BY 
      director_id;
    `;
  const directorsList = await db.all(getDirectorsQuery);
  response.send(
    directorsList.map((eachDirector) =>
      convertDbObjectToResponseObject(eachDirector)
    )
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
    SELECT *
    FROM 
      movie
    WHERE 
      director_id=${directorId};
    `;
  const moviesList = await db.all(getDirectorMoviesQuery);
  response.send(
    moviesList.map((eachMovie) => convertDbObjectToResponseObject(eachMovie))
  );
});

module.exports = app;
