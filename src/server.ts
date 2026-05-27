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
    // Desestruturando os dados do corpo da requisição
    const { title, release_date, genre_id, languages_id, oscar_count } =
        req.body;

    // Validação simples dos dados recebidos
    if (!title || typeof title !== 'string') {
        return res.status(400).send({ error: 'Título do filme é obrigatório' });
    }

    const normalizedTitle = title.trim().toLowerCase();
    if (!normalizedTitle) {
        return res
            .status(400)
            .send({ error: 'Título do filme não pode ser vazio' });
    }

    try {
        // Verificando se já existe um filme com o mesmo título
        const movieWithSameTitle = await prisma.movie.findFirst({
            where: { title: { equals: normalizedTitle, mode: 'insensitive' } },
        });

        if (movieWithSameTitle) {
            return res.status(409).send({
                message: 'Já existe um filme cadastrado com esse título',
            });
        }

        await prisma.movie.create({
            data: {
                title: title.trim(),
                release_date: new Date(release_date),
                genre_id,
                language_id: languages_id,
                oscar_count,
            },
        });
        return res.status(201).send({ message: 'Filme criado com sucesso' });
    } catch (error) {
        console.error('Erro ao criar filme:', error);
        return res.status(500).send({ error: 'Erro ao criar o filme' });
    }
});

// Rota para atualizar um filme existente
app.put('/movies/:id', async (req, res) => {
    // pegar id do filme a ser atualizado
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id,
            },
        });

        if (!movie) {
            return res.status(404).send({ error: 'Filme não encontrado' });
        }

        const data = { ...req.body };

        // Verificação se vier uma data de lançamento, converter para Data, se não, deixar como undefined para não atualizar esse campo
        data.release_date = data.release_date
            ? new Date(data.release_date)
            : undefined;
        console.log('Dados recebidos para atualização:', data);

        //Atualizar o filme no banco de dados usando o Prisma
        await prisma.movie.update({
            where: {
                id,
            },
            data: data,
        });
    } catch (error) {
        console.error('Erro ao atualizar o filme:', error);
        return res.status(500).send({ error: 'Erro ao atualizar o filme' });
    }

    // Retornar resposta de sucesso
    res.status(200).send();
});

// Rota para deletar um filme existente
app.delete('/movies/:id', async (req, res) => {
    const id = Number(req.params.id);

    // Tratamento de erros para garantir que o filme existe antes de tentar deletar e para lidar com possíveis erros durante a operação de exclusão
    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id,
            },
        });

        // Se o filme não for encontrado, retornar um erro 404 para indicar que o recurso não existe
        if (!movie) {
            return res.status(404).send({ error: 'Filme não encontrado' });
        }

        // Método do Prisma para deletar o filme do banco de dados usando o ID fornecido
        await prisma.movie.delete({
            where: {
                id,
            },
        });
    } catch (error) {
        // Caso dê algum erro no bloco try, como um erro de conexão com o banco de dados ou um erro inesperado, ele será capturado aqui e uma resposta de erro 500 será enviada para o cliente, indicando que houve um problema no servidor ao tentar processar a requisição
        return res.status(500).send({ error: 'Erro ao deletar o filme' });
    }
    // Retornar resposta de sucesso
    res.status(200).send();
});

// Rota para filtrar filmes por gênero
app.get('/movies/genre/:genreName', async (req, res) => {
    // Receber o nome do gênero a ser filtrado a partir dos parâmetros da URL usando req.params
    console.log(req.params.genreName);

    try {
        //Filtrar os filmes do banco pelo gênero usando o método findMany do Prisma, onde a condição de filtragem é baseada no nome do gênero, utilizando a opção mode: 'insensitive' para garantir que a busca seja case-insensitive, ou seja, não diferencie maiúsculas de minúsculas
        const moviesFilteredByName = await prisma.movie.findMany({
            where: {
                genres: {
                    name: {
                        equals: req.params.genreName,
                        mode: 'insensitive',
                    },
                },
            },
            include: {
                genres: true,
                languages: true,
            },
        });
        // Retornar os filmes filtrados como resposta JSON usando res.json
        res.status(200).send(moviesFilteredByName);
    } catch (error) {
        res.status(500).send({ error: 'Erro ao filtrar os filmes por gênero' });
    }
});

// Porta onde o servidor irá escutar
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
