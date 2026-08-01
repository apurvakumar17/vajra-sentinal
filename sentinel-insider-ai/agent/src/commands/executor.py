import os
import sys

def execute_command(cmd_name, cmd_args):
    print(f"[*] Executing remote command: {cmd_name}")
    if cmd_name == "lock_workstation":
        # Windows specific lock command
        os.system("rundll32.exe user32.dll,LockWorkStation")
    elif cmd_name == "kill_process":
        pid = cmd_args.get("pid")
        if pid:
            try:
                os.kill(int(pid), 9)
                print(f"[+] Killed process {pid}")
            except Exception as e:
                print(f"[-] Failed to kill process {pid}: {e}")
    elif cmd_name == "restart_agent":
        print("[*] Restarting agent...")
        os.execv(sys.executable, ['python'] + sys.argv)
    else:
        print(f"[-] Unknown command: {cmd_name}")
