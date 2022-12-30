const request = require('supertest');
const db = require('../models/index');
const app = require('../app');
const cheerio = require('cheerio');

let server; let agent;

function fetchCsrfToken(res)
{
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe('todo test suits', ()=>{
  beforeAll(async ()=>{
    await db.sequelize.sync({force: true});
    server = app.listen(process.env.PORT || 4000, ()=>{});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });
  test('Test the functionality of create a new todo item', async () => {
    const getResponse = await agent.get('/');
    const csrfToken = fetchCsrfToken(getResponse);
    const response = await agent.post('/todos').send({
      title: 'copyright year fixed',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302); //http status code
  });
  test('Test the update functionality by updating the markAsCompleted', async () => {
    const getResponse = await agent.get('/');
    let csrfToken = fetchCsrfToken(getResponse);
    await agent.post('/todos').send({
      title: 'copyright year has been changed successfully',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const gropuedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
    const status = latestTodo.completed ? false : true;
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const response = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
      completed: status,
    });
    const parsedUpdateResponse = JSON.parse(response.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });
  test('Test the delete functionality', async () => {
    const getResponse = await agent.get('/');
    let csrfToken = fetchCsrfToken(getResponse);
    await agent.post('/todos').send({
      title: 'Delete functionality checking',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const gropuedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const response = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });
    const parsedUpdateResponse = JSON.parse(response.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test('Test the marking an item as incomplete', async () => {
    const getResponse = await agent.get('/');
    let csrfToken = fetchCsrfToken(getResponse);
    await agent.post('/todos').send({
      title: 'Go to shop',
      dueDate: new Date().toISOString(),
      completed: true,
      '_csrf': csrfToken,
    });
    const TodosItems = await agent.get('/').set('Accept', 'application/json');
    const TodosItemsParse = JSON.parse(TodosItems.text);
    const calculateTodosTodayITem = TodosItemsParse.dueToday.length;
    const Todo = TodosItemsParse.dueToday[calculateTodosTodayITem - 1];
    const boolStatus = !Todo.completed;
    anotherRes = await agent.get('/');
    csrfToken = fetchCsrfToken(anotherRes);

    const changeTodo = await agent.put(`/todos/${Todo.id}`)
    .send({_csrf: csrfToken, completed: boolStatus});

    const UpadteTodoItemParse = JSON.parse(changeTodo.text);
    expect(UpadteTodoItemParse.completed).toBe(boolStatus);
  });
});
