/* eslint-disable no-undef */
const request = require('supertest');
const cheerio = require('cheerio');
const db = require('../models/index');
const app = require('../app');

let server, agent;

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
  afterAll( async () =>{
    await db.sequelize.close();
    server.close();
  });
  test('Test create a new todo item', async () => {
    const getResponse = await agent.get('/');
    const csrfToken = fetchCsrfToken(getResponse);
    const response = await agent.post('/todos').send({
      title: 'Go to college...',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });
  test('Test the update functinality the markAsCompleted', async () => {
    const getResponse = await agent.get('/');
    let csrfToken = fetchCsrfToken(getResponse);
    await agent.post('/todos').send({
      title: 'buy cloth--',
      dueDate: new Date().toISOString(),
      completed: false,
      '_csrf': csrfToken,
    });
    const TodosItems = await agent.get('/').set('Accept', 'application/json');
    const TodosItemsParse = JSON.parse(TodosItems.text);
    const calculateTodosTodayITem = TodosItemsParse.dueToday.length;
    const Todo = TodosItemsParse.dueToday[calculateTodosTodayITem - 1];
    const boolStatus = Todo.completed ? false : true;
    anotherRes = await agent.get('/');
    csrfToken = fetchCsrfToken(anotherRes);

    const changeTodo = await agent.put(`/todos/${Todo.id}`)
    .send({_csrf: csrfToken, completed: boolStatus});

    const UpadteTodoItemParse = JSON.parse(changeTodo.text);
    expect(UpadteTodoItemParse.completed).toBe(true);
  });
  test('Test the delete functionality', async () => {
    const getResponse = await agent.get('/');
    let csrfToken = fetchCsrfToken(getResponse);
    await agent.post('/todos').send({
      title: 'complete task',
      dueDate: new Date().toISOString(),
      completed: false,
      '_csrf': csrfToken,
    });
    const TodosItems = await agent.get('/').set('Accept', 'application/json');
    const TodosItemsParse = JSON.parse(TodosItems.text);
    const calculateTodosTodayITem = TodosItemsParse.dueToday.length;
    const Todo = TodosItemsParse.dueToday[calculateTodosTodayITem - 1];
    const boolStatus = Todo.completed ? false : true;
    anotherRes = await agent.get('/');
    csrfToken = fetchCsrfToken(anotherRes);

    const changeTodo = await agent.delete(`/todos/${Todo.id}`)
    .send({_csrf: csrfToken, completed: boolStatus});

    const boolResponse = Boolean(changeTodo.text);
    expect(boolResponse).toBe(true);
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