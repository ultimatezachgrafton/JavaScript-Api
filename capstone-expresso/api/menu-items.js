const express = require('express');
const sqlite3 = require('sqlite3');

const menuItemsRouter = express.Router({mergeParams: true});

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM MenuItem WHERE menu_id = $menuId", {
        $menuId: req.params.menuId
    }, function(error, items) {
        if (error) {
            next(error);
        } else {
            res.status(200).json({menuItems: items});
        }
    })
});

menuItemsRouter.post('/', (req, res, next) => {
    const menuItemData = req.body.menuItem;
    if(!menuItemData.name || !menuItemData.description || !menuItemData.inventory || !menuItemData.price) {
        return res.sendStatus(400);
    }
    else {
        db.run(`INSERT INTO MenuItem (
            name, description, inventory, price, menu_id
        ) VALUES (
            $name, $description, $inventory, $price, $menuId
        )`, {
            $name: menuItemData.name,
            $description: menuItemData.description,
            $inventory: menuItemData.inventory,
            $price: menuItemData.price,
            $menuId: req.params.menuId
        }, function(error) {
            if (error) {
                next(error);
            } else {
                db.get("SELECT * FROM MenuItem WHERE id = $id", {
                    $id: this.lastID
                }, function(error, item) {
                    if (error) {
                        next(error);
                    }
                    else {
                        res.status(201).json({menuItem: item});
                    }
                })
            }
        })
    }
});

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
    // Get menu item from database with specific id
    db.get("SELECT * FROM MenuItem WHERE id = $menuItemId", {
        $menuItemId: menuItemId
    }, (err, menuItem) => {
        if(err) {
            next(err);
        }
        else if(menuItem) {
            // If found, attach the menu item to the request and move on
            req.menuItem = menuItem;
            next();
        }
        else {
            res.sendStatus(404);
        }
    });
});

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
    const menuItemData = req.body.menuItem;
    if(!menuItemData.name || !menuItemData.description || !menuItemData.inventory || !menuItemData.price) {
        return res.sendStatus(400);
    }
    else {
        db.run(`UPDATE MenuItem SET
            name = $name,
            description = $description,
            inventory = $inventory,
            price = $price
        WHERE id = $menuItemId`, {
            $name: menuItemData.name,
            $description: menuItemData.description,
            $inventory: menuItemData.inventory,
            $price: menuItemData.price,
            $menuItemId: req.params.menuItemId
        }, function(error) {
            if (error) {
                next(error);
            } else {
                db.get("SELECT * FROM MenuItem WHERE id = $id", {
                    $id: req.params.menuItemId
                }, function(error, item) {
                    if (error) {
                        next(error);
                    }
                    else {
                        res.status(200).json({menuItem: item});
                    }
                })
            }
        })
    }
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
    db.run("DELETE FROM MenuItem WHERE id = $id", {
        $id: req.params.menuItemId
    }, function(err) {
        if (err) {
            next(err);
        } else {
            res.sendStatus(204);
        }
    })
});

module.exports = menuItemsRouter;
