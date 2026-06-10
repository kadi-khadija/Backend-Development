#CodeAlpha
#Backend Development
#Hachemaoui Khadija

import sqlite3
import string
import random
from flask import Flask, request, redirect, render_template, url_for

app = Flask(__name__)

def get_db():
    conn = sqlite3.connect("urls.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.execute('''
        CREATE TABLE IF NOT EXISTS urls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_url TEXT NOT NULL,
            short_code TEXT UNIQUE NOT NULL,
            clicks INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    db.commit()
    db.close()

def generate_short_code(length=6):
    characters = string.ascii_letters + string.digits
    while True:
        code = ''.join(random.choices(characters, k=length))
        db = get_db()
        existing = db.execute(
            'SELECT id FROM urls WHERE short_code = ?', (code,)
        ).fetchone()
        db.close()
        if not existing:
            return code

@app.route('/')
def home():
    db = get_db()
    urls = db.execute(
        'SELECT * FROM urls ORDER BY created_at DESC LIMIT 10'
    ).fetchall()
    db.close()
    return render_template('index.html', urls=urls)

@app.route('/shorten', methods=['POST'])
def shorten():
    original_url = request.form.get('url')

    if not original_url:
        return redirect(url_for('home'))

    short_code = generate_short_code()

    db = get_db()
    db.execute(
        'INSERT INTO urls (original_url, short_code) VALUES (?, ?)',
        (original_url, short_code)
    )
    db.commit()

    # Get updated list BEFORE closing
    urls = db.execute(
        'SELECT * FROM urls ORDER BY created_at DESC LIMIT 10'
    ).fetchall()
    db.close()   # close AFTER all queries are done

    short_url = request.host_url + short_code
    return render_template('index.html', short_url=short_url, urls=urls)

@app.route('/<short_code>')
def redirect_url(short_code):
    db = get_db()
    url = db.execute(
        'SELECT * FROM urls WHERE short_code = ?', (short_code,)
    ).fetchone()

    if url:
        db.execute(
            'UPDATE urls SET clicks = clicks + 1 WHERE short_code = ?',
            (short_code,)
        )
        db.commit()
        db.close()
        return redirect(url['original_url'])

    db.close()
    return "URL not found!", 404

if __name__ == '__main__':
    init_db()
    app.run(debug=True)