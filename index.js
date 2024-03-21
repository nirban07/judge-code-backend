const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const axios = require("axios");

app.use(cors());
app.use(express.json());

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// fucntion to create submission
async function createSubmissions(data) {
  const options = {
    method: "POST",
    url: process.env.JUDGE0_URL,
    params: {
      base64_encoded: "true",
      fields: "*",
    },
    headers: {
      "content-type": "application/json",
      "Content-Type": "application/json",
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
      "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
    },
    data: {
      language_id: Number(data.languages),
      source_code: btoa(data.sourceCode),
      stdin: btoa(data.stdin),
    },
  };
  //   console.log(data);
  try {
    const response = await axios.request(options);
    if (response.status === 201) {
      return response.data.token;
    }
  } catch (error) {
    console.error(error.response.status);
    return "there was some error " + error.response.status;
  }
}
// abbebadb-6d1a-4fcb-8aaa-b77ce1fdd752
async function checkStatus(token) {
  const options = {
    method: "GET",
    url: process.env.JUDGE0_URL + token,
    params: {
      base64_encoded: "true",
      fields: "*",
    },
    headers: {
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
      "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
    },
  };
  try {
    const response = await axios.request(options);
    if (response.data.status_id == 1 || response.data.status_id == 2) {
      setTimeout(() => {
        checkStatus(token);
      }, 2000);
    }
    return response.data;
  } catch (error) {
    console.error(error.status);
  }
}

app.post("/", async (req, res) => {
  const body = req.body;
  // console.log(body);
  const token = await createSubmissions(body);
  const answer = await checkStatus(token);
  // console.log(token);
  // console.log(answer);

  const data = await prisma.codeSnippet.create({
    data: {
      username: body.username,
      language: body.languages,
      sourceCode: body.sourceCode,
      stdin: body.stdin,
      stdout: atob(answer.stdout),
      createdAt: answer.created_at,
    },
  });
  res.send({ ...answer, stdout: atob(answer.stdout) });
});

app.post("/logs", async (req, res) => {
  const logs = await prisma.codeSnippet.findMany();
  res.send(logs);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
