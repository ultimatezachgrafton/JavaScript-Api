const express = require('express');
const sqlite3 = require('sqlite3');
const menuItemsRouter = require('./menu-items.js');

const menusRouter = express.Router();

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menusRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Menu", (err, menus) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({menus: menus});
        }
    })
});

menusRouter.post('/', (req, res, next) => {
    const menuData = req.body.menu;
    if(!menuData.title) {
        return res.sendStatus(400);
    }
    else {
        db.run(`INSERT INTO Menu (
            title
        ) VALUES (
            $title
        )`, {
            $title: menuData.title
        }, function(err) {
            if (err) {
                next(err);
            } else {
                db.get("SELECT * FROM Menu WHERE id = $id", {
                    $id: this.lastID
                }, function(err, menu) {
                    if (err) {
                        next(err);
                    } else {
                        res.status(201).json({menu: menu});
                    }
                });
            }
        });
    }
});

menusRouter.param('menuId', (req, res, next, menuId) => {
    // Get menu from database with specific id
    db.get("SELECT * FROM Menu WHERE id = $menuId", {
        $menuId: menuId
    }, (err, menu) => {
        if(err) {
            next(err);
        }
        else if(menu) {
            // If found, attach the menu to the request and move on
            req.menu = menu;
            next();
        }
        else {
            res.sendStatus(404);
        }
    });
});

menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json({menu: req.menu});
});

menusRouter.put('/:menuId', (req, res, next) => {
    const menuData = req.body.menu;
    if(!menuData.title) {
        return res.sendStatus(400);
    }
    else {
        db.run(`UPDATE Menu SET title = $title WHERE id = $id`, {
            $title: menuData.title,
            $id: req.params.menuId
        }, function(err) {
            if (err) {
                next(err);
            } else {
                db.get("SELECT * FROM Menu WHERE id = $id", {
                    $id: req.params.menuId
                }, function(err, menu) {
                    if (err) {
                        next(err);
                    } else {
                        res.status(200).json({menu: menu});
                    }
                });
            }
        });
    }
});

menusRouter.delete('/:menuId', (req, res, next) => {
    db.all("SELECT * FROM MenuItem WHERE menu_id = $menuId", {
        $menuId: req.params.menuId
    }, function(err, menuItems) {
        if (err) {
            next(err);
        } else {
            if(!menuItems || menuItems.length == 0) {
                db.run("DELETE FROM Menu WHERE id = $menuId", {
                    $menuId: req.params.menuId
                }, function(err) {
                    if (err) {
                        next(err);
                    } else {
                        return res.sendStatus(204);
                    }
                })
            }
            else {
                return res.sendStatus(400);
            }
        }
    })
});

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

module.exports = menusRouter;
