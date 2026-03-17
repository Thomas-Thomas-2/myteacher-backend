const request = require('supertest');
const app = require('./app');

it('PUT /students/changeStatus', async () => {
    const res = (await request(app).put('/students/changeStatus').send({id: "69a80544b469b0638eef7cc8", status: "Actif"})) //Perfect condition "Actif"
    
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toEqual(true);
    expect(res.body.student.status).toEqual("Actif");
})

it('PUT /students/changeStatus', async () => {
    const res = (await request(app).put('/students/changeStatus').send({id: "69a80544b469b0638eef7cc8", status: "Inactif"})) //Perfect condition "Inactif"
    
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toEqual(true);
    expect(res.body.student.status).toEqual("Inactif");
})

it('PUT missing field /students/changeStatus', async () => {
    const res = (await request(app).put('/students/changeStatus').send({status: "Actif"})) //Missing field
    
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toEqual(false);
    expect(res.body.error).toEqual("Missing or empty fields");
})

it('PUT unknown Id /students/changeStatus', async () => {
    const res = (await request(app).put('/students/changeStatus').send({id: "69a80544b469b0638eef7c10", status: "Actif"})) //Unknown id in DB
    
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toEqual(false);
    expect(res.body.error).toEqual("No student found");
})

/*
it('DELETE /lessons/removeEvent', async () => {
    const loginRes = await request(app)
    .post('/users/login')
    .send({
        email: 'jetestdestruc@gmail.com',
        password: '123456789'
    });
    const token = loginRes.body.token;
    const res = (await request(app).delete('/lessons/removeEvent/69a958ee0bb2cdc045b65d92').set('Cookies', `Bearer ${token}`)) //Perfect condition
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toEqual(true);
});

it('DELETE unknown Id /lessons/removeEvent', async () => {
    const loginRes = await request(app)
    .post('/users/login')
    .send({
        email: 'jetestdestruc@gmail.com',
        password: '123456789'
    });
    const token = loginRes.body.token;
    const res = (await request(app).delete('/lessons/removeEvent/69a958ee0bb2cdc045b65d10').set('Cookies', token)) //Perfect condition
    
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toEqual(false);
    expect(res.body.error).toEqual("Lesson not found");
});
*/
