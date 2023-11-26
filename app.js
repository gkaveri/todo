const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
const isValid = require('date-fns/isValid')
const app = express()
app.use(express.json())

let db = null
const initializeDbAndServe = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, 'todoApplication.db'),
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at https://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error is ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServe()

const hasPriorityAndStatusProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryAndStatusProperty = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriorityProperty = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const outPutResult = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {search_q = '', priority, status, category} = request.query

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`
          data = await db.all(getTodoQuery)
          response.send(data.map(eachItem => outPutResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasCategoryAndStatusProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE status = '${status}' and category = '${category}';`
          data = await db.all(getTodoQuery)
          response.send(data.map(eachItem => outPutResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasCategoryAndPriorityProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE category = '${category}' and priority = '${priority}';`
          data = await db.all(getTodoQuery)
          response.send(data.map(eachItem => outPutResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}';`
        data = await db.all(getTodoQuery)
        response.send(data.map(eachItem => outPutResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodoQuery = `SELECT * FROM todo WHERE status = '${status}';`
        data = await db.all(getTodoQuery)
        response.send(data.map(eachItem => outPutResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasSearchProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
      data = await db.all(getTodoQuery)
      response.send(data.map(eachItem => outPutResult(eachItem)))
      break

    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodoQuery = `SELECT * FROM todo WHERE category = '${category}';`
        data = await db.all(getTodoQuery)
        response.send(data.map(eachItem => outPutResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    default:
      getTodoQuery = `SELECT * FROM todo ;`
      data = await db.all(getTodoQuery)
      response.send(data.map(eachItem => outPutResult(eachItem)))
  }
})
//api 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`
  const responseResult = await db.get(getTodoQuery)
  response.send(outPutResult(responseResult))
})
//api3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  console.log(isMatch(date, 'yyyy-MM-dd'))
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    console.log(newDate)
    const requestQuery = `SELECT * FROM todo where due_date = '${newDate}';`
    const responseResult = await db.all(requestQuery)
    response.send(responseResult.map(eachItem => outPutResult(eachItem)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

// api4
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body;
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW'){
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE'){
      if(
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ){
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postNewDueDate = format(new Date(dueDate),'yyyy-MM-dd');
          const postTodoQuery = `INSERT INTO todo (id, todo, status, category, priority, due_date)
                VALUES(${id}, '${status}','${priority}','${category}','${todo}','${postNewDueDate}');`;
                 await db.run(postTodoQuery);

                 response.send("Todo Successfully Added");
        }else{
          response.status(400);
          response.send('Invalid Due Date');
        }
      }else{
        response.status(400);
        response.send("Invalid Todo Category");
      }
    }else{
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }else{
    response.status(400);
    response.send('Invalid Todo Priority');
  }
});

//api 5
app.put('/todos/:todoId/', async (request, response) => {
      const {todoId} = request.params;
      let updateColumn = "";
      const requestBody = request.body;
      console.log(requestBody);
      const previousTodoQuery = `SELECT * FROM todo
          WHERE id = ${todoId};`;
      const previousTodo = await db.get(previousTodoQuery);
      const {
        todo = previousTodo.todo,
        priority = previousTodo.priority,
        status = previousTodo.status,
        category = previousTodo.category,
        dueDate = previousTodo.dueDate,
      } = request.body;

      let updateTodoQuery;
      switch (true) {
        case requestBody.status !== undefined:
            if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE'){
              updateTodoQuery = `UPDATE todo SET todo ='${todo}', prioirty = '${priority}', status='${status}'
              ,category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`;

                  await db.run(updateTodoQuery);
                  response.send('Status Updated');
            }else{
              response.status(400);
              response.send("Invalid Todo Status");
            }
            break; 
        case requestBody.priority !== undefined:
          if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
            updateTodoQuery = `UPDATE todo SET todo ='${todo}', prioirty = '${priority}', status='${status}'
              ,category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`;

              await db.run(updateTodoQuery);
              response.send('Priority Updated');
            }else{
              response.status(400);
              response.send("Invalid Todo Priority");
            }
            break; 
        case requestBody.todo !== undefined:
          updateTodoQuery = `UPDATE todo SET todo ='${todo}', prioirty = '${priority}', status='${status}'
              ,category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`;

              await db.run(updateTodoQuery);
              response.send('Todo Updated');
              break;
        case requestBody.category !== undefined:
          if(
            category === 'WORK' ||
            category === 'HOME' ||
            category === 'LEARNING'
            ){
            updateTodoQuery = `UPDATE todo SET todo ='${todo}', prioirty = '${priority}', status='${status}'
              ,category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`;

              await db.run(updateTodoQuery);
              response.send('Category Updated');
            }else{
              response.status(400);
              response.send("Invalid Todo Category");
            }
            break; 
        case requestBody.dueDate !== undefined:
          if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const newDueDate = format(new Date(dueDate),'yyyy-MM-dd');
            updateTodoQuery = `UPDATE todo SET todo ='${todo}', prioirty = '${priority}', status='${status}'
              ,category = '${category}', due_date = '${newDueDate}' WHERE id = ${todoId};`;

              await db.run(updateTodoQuery);
              response.send('Due Date Updated');
            }else{
              response.status(400);
              response.send("Invalid Due Date");
            }
            break;
      }
});

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
})

module.exports = app;