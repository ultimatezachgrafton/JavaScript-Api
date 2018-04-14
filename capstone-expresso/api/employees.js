const express = require('express');
const sqlite3 = require('sqlite3');
const timesheetsRouter = require('./timesheets');

const employeesRouter = express.Router();

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Get all employees without param
employeesRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Employee WHERE Employee.is_current_employee = 1", (err, rows) => {
        if(err) {
            next(err);
        }
        else {
            res.status(200).json({employees: rows});
        }
    })
});

// Post to /employee
employeesRouter.post('/', (req, res, next) => {
    let employeeData = req.body.employee;
    if(!employeeData.name || !employeeData.position || !employeeData.wage) {
        return res.sendStatus(400);
    }
    if(!employeeData.is_current_employee) {
        employeeData.is_current_employee = 1;
    }
    db.run(`INSERT INTO Employee (
        name, position, wage, is_current_employee
    ) VALUES (
        $name, $position, $wage, $isCurrentEmployee
    )`, {
        $name: employeeData.name,
        $position: employeeData.position,
        $wage: employeeData.wage,
        $isCurrentEmployee: employeeData.is_current_employee
    }, function(error) {
        db.get("SELECT * FROM Employee WHERE id = $id", {
            $id: this.lastID
        }, function(err, emp) {
            if(err) {
                next(err);
            }
            else {
                res.status(201).json({employee: emp});
            }
        })
    });
});

// Param for specific employee id
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
    // Get employee from database with specific id
    db.get("SELECT * FROM Employee WHERE id = $employeeId", {
        $employeeId: employeeId
    }, (err, employee) => {
        if(err) {
            next(err);
        }
        else if(employee) {
            // If found, attach the employee to the request and move on
            req.employee = employee;
            next();
        }
        else {
            res.sendStatus(404);
        }
    });
});

// Get employee by id
employeesRouter.get('/:employeeId', (req, res, next) => {
    // Errors are handled by param attachment, so if it gets here it's a successful call
    res.status(200).json({employee: req.employee})
});

employeesRouter.put('/:employeeId', (req, res, next) => {
    let employeeData = req.body.employee;
    if(!employeeData.name || !employeeData.position || !employeeData.wage) {
        return res.sendStatus(400);
    }
    if(!employeeData.is_current_employee) {
        employeeData.is_current_employee = 1;
    }
    db.run(`UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE Employee.id = $employeeId`, {
        $name: employeeData.name,
        $position: employeeData.position,
        $wage: employeeData.wage,
        $isCurrentEmployee: employeeData.is_current_employee,
        $employeeId: req.params.employeeId
    }, function(error) {
        db.get("SELECT * FROM Employee WHERE id = $id", {
            $id: req.params.employeeId
        }, function(err, emp) {
            if(err) {
                next(err);
            }
            else {
                res.status(200).json({employee: emp});
            }
        })
    });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    db.run(`UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId`, {
        $employeeId: req.params.employeeId
    }, function(error) {
        db.get("SELECT * FROM Employee WHERE id = $id", {
            $id: req.params.employeeId
        }, function(err, emp) {
            if(err) {
                next(err);
            }
            else {
                res.status(200).json({employee: emp});
            }
        })
    });
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

module.exports = employeesRouter;
