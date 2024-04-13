# sportsort

## Requirements

### Redis

First install, if you haven't
```
brew update
brew install redis python@3.12
```

Start it by
```
brew services start redis
```

### Installation

```
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Running the Application

Make sure the redis server is running
``` 
redis-cli ping
```
Should get the response "PONG"

If not, run
either
```
brew services restart redis
```
or
```
redis-server
```

Then, start the Flask applicatoin by running
```
flask run
```

