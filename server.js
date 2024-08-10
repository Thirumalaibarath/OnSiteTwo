const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

const Sleva_Trade_DB = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Pushpa#23',
    database: 'Sleva_Trade'
});

const SECRET_KEY = 'your_secret_key';

Sleva_Trade_DB.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to Sleva_Trade_DB database');
});

app.post('/login', (req, res) => {
    const user_id  = req.query.user_id;

    // Generate JWT
    const token = jwt.sign({ user_id: user_id }, SECRET_KEY, { expiresIn: '1h' });

    return res.status(200).json({ token });
});


// Middleware to protect routes
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });

        req.user = user; // Store user info in request object
        next();
    });
}



app.post('/add-user', (req,res) => {
    const insert_new_user_to_userDB_query = 'INSERT INTO users_DB (money) VALUES (?)';
    Sleva_Trade_DB.query(insert_new_user_to_userDB_query, [0], (err) => {
        if(err)
        {
            console.log("error-registering-new-user-to-userDB"+err)
            return res.status(422).json({ error: 'error registering new user to userDB'});
        }
    })
    return res.status(200).json({ success: 'user created successfully'});
});

app.post('/rand_coins',authenticateToken, (req,res) => {
    const user_id  = req.user.user_id;

    const get_coins_query = "SELECT money FROM users_DB WHERE userid = ?";

    Sleva_Trade_DB.query(get_coins_query, [user_id], (err, money) => {

        if(err)
        {
            console.log("error-selecting-money-from-users"+err)
            return res.status(404).json({ error: 'error selecting money from users'});
        }

        var initial_amount = money[0].money + getRandomInt(1001,4999)

        const add_coins_query = "UPDATE users_DB SET money = ? WHERE userid = ?";

        Sleva_Trade_DB.query(add_coins_query, [initial_amount,user_id], (err) => {

            if(err)
            {
                console.log("error-updating-money-for-user"+err)
                return res.status(422).json({ error: 'error updating money for user'});
            }
        
        })

    })

    return res.status(200).json({ success: 'coins added successfully'});
    
});


// buy end point
app.post('/buy', (req,res) => {
    const user_id  = req.query.user_id;
    const item_id  = req.query.item_id;

    // const get_money_query = "SELECT money FROM items_DB WHERE itemid = ?";

    const get_giver_query = "SELECT userid,itemstat,money FROM items_DB WHERE itemid = ?";

    Sleva_Trade_DB.query(get_giver_query, [item_id], (err, result) => {

        if(err)
        {
            console.log("error-selecting-userid-from-items "+err)
            return res.status(404).json({ error: 'error selecting userid from items'});
        }

        let giver_id = result[0].userid

        let item_stat = result[0].itemstat


        if(giver_id == user_id)
        {
            return res.status(403).json({ error: 'invalid credantials' });
        }

        if(item_stat == "private")
        {
            return res.status(403).json({ error: "can't buy" });
        }

        
            console.log(result[0].money)
    
           
            let money = result[0].money
            
    
            // transaction 
            
            const get_money_for_user_query = "SELECT money FROM users_DB WHERE userid = ?";
    
            Sleva_Trade_DB.query(get_money_for_user_query, [user_id], (err, user_money) => {
    
                if(err)
                {
                console.log("error-selecting-money-from-user "+err)
                return res.status(404).json({ error: 'error selecting money from user'});
                }

                // console.log('user',user_money[0].money)
    
                let updated_money= user_money[0].money - money
    
                const update_money_query = "UPDATE users_DB SET money = ? WHERE userid = ?";
    
                Sleva_Trade_DB.query(update_money_query, [updated_money,user_id], (err,) => {
    
                    if(err)
                    {
                        console.log("error-updating-money-for-users "+err)
                        return res.status(422).json({ error: 'error updating money for users'});
                    }
                })
            })
    
            // 2
    
            const get_money_for_giver_query = "SELECT money FROM users_DB WHERE userid = ?";
    
            Sleva_Trade_DB.query(get_money_for_giver_query, [giver_id], (err, giver_money) => {
    
                if(err)
                {
                    console.log("error-selecting-money-from-giver "+err)
                    return res.status(404).json({ error: 'error selecting money from giver'});
                }

                console.log(giver_money[0].money)
    
                let updated_money= giver_money[0].money + money
    
                const update_money_query = "UPDATE users_DB SET money = ? WHERE userid = ?";
    
                Sleva_Trade_DB.query(update_money_query, [updated_money,giver_id], (err,) => {
    
                    if(err)
                    {
                        console.log("error-updating-money-for-giver "+err)
                        return res.status(422).json({ error: 'error updating money for giver'});  
                    }
                })
            })
    
    


        // updating the item 
    const update_item_stat = "UPDATE items_DB SET userid = ?,itemstat = ? WHERE itemid = ?";

    Sleva_Trade_DB.query(update_item_stat, [user_id,"private",item_id], (err,) => {

        if(err)
        {
            console.log("error-updating-item "+err)
            return res.status(422).json({ error: 'error updating item'});  
        }
    })

    return res.status(200).json({success: 'buy success'});  

    })
}) 


//  make things available 
app.post('/sell', (req,res) => {
    const item_id  = req.query.item_id;

    let item_stat = "available to buy"

    const update_item_stat = "UPDATE items_DB SET itemstat = ? WHERE itemid = ?";

    Sleva_Trade_DB.query(update_item_stat, [item_stat,item_id], (err,) => {

        if(err)
        {
            console.log("error-updating-item "+err)
            return res.status(422).json({ error: 'error updating item'});  
        }
    })

    return res.status(200).json({success: 'sell success'});  
})


// create item 
app.post('/create_item', (req,res) => {
    const user_id  = req.query.user_id;
    const item_name  = req.query.item_name;

    let money = getRandomInt(1001,1999)
    let itemstat = "private"

    const create_items_query = "INSERT INTO items_DB (userid,money,itemstat,itemname) VALUES (?,?,?,?)";

    Sleva_Trade_DB.query(create_items_query, [user_id,money,itemstat,item_name], (err) => {

        if(err)
        {
            console.log("error-inserting-values-to-items_DB "+err)
            return res.status(422).json({ error: "error inserting values to items-DB "});  
        }
    })

    return res.status(200).json({success: 'create success'});  

});

// available_to_buy

app.get('/available_to_buy', (req, res) => {
    const user_id  = req.query.user_id;

    let item_stat = "available to buy"

    const fetch_all_items_available_to_buy = "SELECT itemid,itemname,money FROM items_DB WHERE userid != ? AND itemstat = ?";
    Sleva_Trade_DB.query(fetch_all_items_available_to_buy,[user_id,item_stat], (err, items) => {
        if (err) {
            console.error('error-fetching-items', err);
            return res.status(404).json({ error: "error fetching items"});  
        }
        console.table(items);

    });
    return res.status(200).json({success: 'fetch success'});  
});

// available_to_sell

app.get('/available_to_sell', (req, res) => {
    const user_id  = req.query.user_id;

    let item_stat = "available to buy"

    const fetch_all_items = "SELECT itemid,itemname,money FROM items_DB WHERE userid = ? AND itemstat = ?";
    Sleva_Trade_DB.query(fetch_all_items,[user_id,item_stat], (err, items) => {
        if (err) {
            console.error('error-fetching-items', err);
            return res.status(404).json({ error: "error fetching items"}); 
        }
        console.table(items);

    });
    return res.status(200).json({success: 'fetch success'});  
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});