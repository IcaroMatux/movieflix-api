import express from 'express';
import { PrismaClient } from './generated/prisma/index.js';

const port = 3000;
const app = express();
const prisma = new PrismaClient();

// Preparando o servidor para receber requisições JSON no corpo das requisições
app.use(express.json());

// Rota para obter todos os filmes
app.get('/movies', async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: 'asc',
        },
        include: {
            genres: true,
            languages: true,
        },
    });
    res.json(movies);
});

// Rota para criação de um novo filme (exemplo)
app.post('/movies', async (req, res) => {
    //Desestruturando os dados do corpo da requisição
    const { title, release_date, genre_id, languages_id, oscar_count } =
        req.body;

    //Validação simples dos dados recebidos
    try {
        await prisma.movie.create({
            data: {
                title,
                release_date: new Date(release_date),
                genre_id,
                languages_id,
                oscar_count,
            },
        });
        return res.status(201).send({ message: 'Filme criado com sucesso' });
    } catch (error) {
        console.error('Erro ao criar filme:', error);
        return res.status(500).send({ error: 'Erro ao criar o filme' });
    }
});

// Porta onde o servidor irá escutar
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
