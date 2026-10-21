import urllib.request, json, time, subprocess, socket, base64, os, sys

cmd = [
    r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    '--headless=new',
    '--remote-debugging-port=9228',
    '--remote-allow-origins=*',
    '--user-data-dir=C:/Users/Espaço Maker FabLab/AppData/Local/Temp/chr_test_9228',
    '--disable-extensions',
    'http://localhost:8080/'
]

proc = subprocess.Popen(cmd)
time.sleep(3)

def ws_handshake(sock, host, path):
    key = base64.b64encode(os.urandom(16)).decode('utf-8')
    req = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        f"Sec-WebSocket-Version: 13\r\n\r\n"
    )
    sock.sendall(req.encode('utf-8'))
    resp = sock.recv(4096)
    return b"101 " in resp

def ws_send(sock, msg):
    payload = msg.encode('utf-8')
    header = bytearray([0x81])
    length = len(payload)
    mask = os.urandom(4)
    if length <= 125:
        header.append(0x80 | length)
    elif length <= 65535:
        header.append(0x80 | 126)
        header.extend(length.to_bytes(2, 'big'))
    else:
        header.append(0x80 | 127)
        header.extend(length.to_bytes(8, 'big'))
    header.extend(mask)
    masked = bytearray([b ^ mask[i % 4] for i, b in enumerate(payload)])
    sock.sendall(header + masked)

def ws_recv(sock):
    header = sock.recv(2)
    if not header or len(header) < 2: return ""
    length = header[1] & 0x7F
    if length == 126:
        ext = sock.recv(2)
        length = int.from_bytes(ext, 'big')
    elif length == 127:
        ext = sock.recv(8)
        length = int.from_bytes(ext, 'big')
    data = b""
    while len(data) < length:
        chunk = sock.recv(length - len(data))
        if not chunk: break
        data += chunk
    return data.decode('utf-8', errors='ignore')

try:
    tabs = json.loads(urllib.request.urlopen('http://localhost:9228/json').read().decode())
    target = next((t for t in tabs if 'localhost:8080' in t.get('url', '')), tabs[0])
    path = target['webSocketDebuggerUrl'].split(':9228')[1]
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(('localhost', 9228))
    if not ws_handshake(sock, 'localhost:9228', path):
        sys.exit(1)
        
    ws_send(sock, json.dumps({"id": 1, "method": "Runtime.enable"}))
    ws_send(sock, json.dumps({"id": 2, "method": "Log.enable"}))
    time.sleep(0.5)
    
    # Simulate playing the game: start game, activate clone, shoot all weapons, hit enemies
    play_script = """
    (function() {
        window.gameInstance.startGame();
        
        // Let's test triggering clone
        window.gameInstance.player.triggerClones(window.gameInstance);
        
        // Spawn each enemy type and hit them with each weapon type
        var weapons = ['blaster', 'plasma', 'spread', 'missile', 'railgun'];
        
        // Let's unlock weapons and give ammo to test
        for (var w in window.gameInstance.player.weapons) {
            window.gameInstance.player.weapons[w].unlocked = true;
            window.gameInstance.player.weapons[w].ammo = 99;
        }
        
        // Shoot with each weapon
        for (var i = 0; i < weapons.length; i++) {
            window.gameInstance.player.switchWeapon(weapons[i]);
            window.gameInstance.player.shoot(window.gameInstance);
        }
        
        // Spawn enemies
        window.gameInstance.spawnEnemy();
        var boss = new DreadnoughtBoss(400, 150, 55);
        window.gameInstance.boss = boss;
        window.gameInstance.enemies.push(boss);
        window.gameInstance.enemies.push(new BossMinion(boss, -90, 20, "Minion1", '#ffe600'));
        window.gameInstance.enemies.push(new Asteroid(400, 200, 32, true));
        window.gameInstance.enemies.push(new CruiserEnemy(300, 200));
        window.gameInstance.enemies.push(new InterceptorEnemy(200, 200));
        
        return "Setup simulation complete";
    })()
    """
    ws_send(sock, json.dumps({
        "id": 10,
        "method": "Runtime.evaluate",
        "params": {"expression": play_script, "returnByValue": True}
    }))
    
    # Now let it run and simulate collisions and clone expiration
    # Clone expires in 14 seconds normally, let's fast forward cloneTimer to 0.05
    time.sleep(1.0)
    fast_forward = """
    (function() {
        window.gameInstance.player.cloneTimer = 0.02; // trigger dissipation!
        return "Clone timer set to dissipate";
    })()
    """
    ws_send(sock, json.dumps({
        "id": 20,
        "method": "Runtime.evaluate",
        "params": {"expression": fast_forward, "returnByValue": True}
    }))
    
    # Now listen for 5 seconds for any Runtime.exceptionThrown or Log.entryAdded
    sock.settimeout(1.0)
    start = time.time()
    while time.time() - start < 6.0:
        try:
            m = ws_recv(sock)
            if m:
                d = json.loads(m)
                if "exception" in d.get("method", "").lower():
                    print("CRITICAL EXCEPTION:", json.dumps(d, indent=2))
                elif "result" in d and d.get("id") in (10, 20):
                    print("EVAL:", d["result"])
        except socket.timeout:
            pass
            
    # Check if gameLoop is still running (frame count advancing)
    check_loop = """
    (function() {
        var t1 = window.gameInstance.lastTime;
        return {
            lastTime: t1,
            state: window.gameInstance.state,
            bullets: window.gameInstance.bullets.length,
            enemies: window.gameInstance.enemies.length,
            particles: window.gameInstance.particles.length
        };
    })()
    """
    ws_send(sock, json.dumps({
        "id": 30,
        "method": "Runtime.evaluate",
        "params": {"expression": check_loop, "returnByValue": True}
    }))
    time.sleep(0.5)
    for _ in range(5):
        try:
            m = ws_recv(sock)
            if m:
                d = json.loads(m)
                if d.get("id") == 30:
                    print("LOOP CHECK 1:", d.get("result"))
        except:
            break
            
    time.sleep(1.0)
    ws_send(sock, json.dumps({
        "id": 40,
        "method": "Runtime.evaluate",
        "params": {"expression": check_loop, "returnByValue": True}
    }))
    for _ in range(5):
        try:
            m = ws_recv(sock)
            if m:
                d = json.loads(m)
                if d.get("id") == 40:
                    print("LOOP CHECK 2:", d.get("result"))
        except:
            break

finally:
    proc.terminate()
