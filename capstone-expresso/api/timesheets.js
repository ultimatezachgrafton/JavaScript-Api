const express = require('express');
const sqlite3 = require('sqlite3');

const timesheetsRouter = express.Router({mergeParams: true});

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Timesheet WHERE employee_id = $employeeId", {
        $employeeId: req.params.employeeId
    }, function(error, timesheets) {
        if(error) {
            next(error);
        }
        else {
            res.status(200).json({timesheets: timesheets});
        }
    })
});

timesheetsRouter.post('/', (req, res, next) => {
    const sheetData = req.body.timesheet;
    if(!sheetData.hours || !sheetData.rate || !sheetData.date) {
        res.sendStatus(400);
    }
    else {
        db.run(`INSERT INTO Timesheet (
            hours, rate, date, employee_id
        ) VALUES (
            $hours, $rate, $date, $employeeId
        )`, {
            $hours: sheetData.hours,
            $rate: sheetData.rate,
            $date: sheetData.date,
            $employeeId: req.params.employeeId
        }, function(err) {
            if (err) {
                next(err);
            } else {
                db.get("SELECT * FROM Timesheet WHERE id = $id", {
                    $id: this.lastID
                }, function(err, sheet) {
                    if(err) {
                        next(err);
                    }
                    else {
                        res.status(201).json({timesheet: sheet});
                    }
                })
            }
        })
    }
});

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
    db.get("SELECT * FROM Timesheet WHERE id = $id", {
        $id: timesheetId
    }, (error, sheet) => {
        if (error) {
            next(error);
        } else if(sheet) {
            req.timesheet = sheet;
            next();
        }
        else {
            res.sendStatus(404);
        }
    })
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
    const sheetData = req.body.timesheet;
    if(!sheetData.hours || !sheetData.rate || !sheetData.date) {
        res.sendStatus(400);
    }
    else {
        db.run("UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE id = $id", {
            $hours: sheetData.hours,
            $rate: sheetData.rate,
            $date: sheetData.date,
            $id: req.params.timesheetId,
        }, function(err) {
            if (err) {
                next(err);
            } else {
                db.get("SELECT * FROM Timesheet WHERE id = $id", {
                    $id: req.params.timesheetId
                }, (err, sheet) => {
                    if (err) {
                        next(err);
                    } else {
                        res.status(200).json({timesheet: sheet});
                    }
                });
            }
        })
    }
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    db.run("DELETE FROM Timesheet WHERE id = $id", {
        $id: req.params.timesheetId
    }, function(err) {
        if (err) {
            next(err);
        } else {
            res.sendStatus(204);
        }
    })
});

module.exports = timesheetsRouter;
