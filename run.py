import subprocess
import sys
import time
import webbrowser
import os
import signal

def run_backend():
    print("Starting Flask Backend...")
    # Disable Flask reloader to avoid conflict with subprocess monitoring
    env = os.environ.copy()
    env["FLASK_DEBUG"] = "0" 
    return subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=os.path.join(os.getcwd(), "backend"),
        env=env
    )

def run_frontend():
    print("Starting Frontend Server on http://localhost:3001...")
    return subprocess.Popen(
        [sys.executable, "-m", "http.server", "3001"],
        cwd=os.path.join(os.getcwd(), "frontend")
    )

def main():
    backend_proc = None
    frontend_proc = None
    
    try:
        backend_proc = run_backend()
        frontend_proc = run_frontend()
        
        # Wait a moment for servers to initialize
        time.sleep(3)
        
        if backend_proc.poll() is not None:
            print(f"Backend failed to start. Check if port 5001 is already in use.")
            return
        if frontend_proc.poll() is not None:
            print(f"Frontend failed to start. Check if port 3001 is already in use.")
            return

        print("\n" + "="*40)
        print("INVENTORY SYSTEM IS ACTIVE")
        print("Backend:  http://localhost:5001")
        print("Frontend: http://localhost:3001")
        print("="*40)
        
        print("\nOpening your browser...")
        webbrowser.open("http://localhost:3001/login.html")
        
        print("\nKEEP THIS TERMINAL OPEN. Press Ctrl+C to stop.")
        
        while True:
            if backend_proc.poll() is not None:
                print(f"\nBackend stopped unexpectedly (Exit code: {backend_proc.poll()})")
                break
            if frontend_proc.poll() is not None:
                print(f"\nFrontend stopped unexpectedly (Exit code: {frontend_proc.poll()})")
                break
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("\nReceived stop signal...")
    except Exception as e:
        print(f"\nAn error occurred in the run script: {e}")
    finally:
        print("Cleaning up processes...")
        if backend_proc:
            try:
                backend_proc.terminate()
                backend_proc.wait(timeout=5)
            except:
                backend_proc.kill()
        if frontend_proc:
            try:
                frontend_proc.terminate()
                frontend_proc.wait(timeout=5)
            except:
                frontend_proc.kill()
        print("Servers stopped successfully.")

if __name__ == "__main__":
    main()
