from flask import Flask, session, render_template, request, redirect, url_for
from flask_session import Session
import redis

app = Flask(__name__)

# Set the secret key for signing cookies
app.config['SECRET_KEY'] = 'a_random_secret_key'

# Configure session to use Redis
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_REDIS'] = redis.StrictRedis(host='localhost', port=6379, db=0)

Session(app)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        session['username'] = request.form['username']
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    username = session.get('username', 'Guest')
    return render_template('dashboard.html', username=username)

if __name__ == '__main__':
    app.run(debug=True)
