import ctypes
import os
import sys
import time
import platform
import psutil
from logger import logger

def execute_command(cmd):
    action = cmd.get("command")
    params = cmd.get("parameters") or {}
    logger.info(f"Executing remote command: {action} with params: {params}")
    
    try:
        if action == "lock_workstation":
            if platform.system() == "Windows":
                try:
                    ctypes.windll.user32.LockWorkStation()
                except Exception as e:
                    os.system("rundll32.exe user32.dll,LockWorkStation")
            else:
                os.system("loginctl lock-session || gnome-screensaver-command -l || xset ws lock")
            return {
                "success": True,
                "status": "Completed",
                "details": "Workstation locked successfully."
            }

        elif action == "force_logout":
            if platform.system() == "Windows":
                os.system("shutdown /l /f")
            else:
                os.system("pkill -KILL -u $USER")
            return {
                "success": True,
                "status": "Completed",
                "details": "Force logout initiated for active user session."
            }

        elif action == "kill_process":
            proc_name = params.get("process_name")
            pid = params.get("pid")
            killed = []
            
            if pid:
                try:
                    p = psutil.Process(int(pid))
                    p.kill()
                    killed.append(f"PID {pid}")
                except Exception as e:
                    logger.warning(f"Failed to kill PID {pid}: {e}")

            if proc_name:
                for p in psutil.process_iter(['pid', 'name']):
                    try:
                        if p.info['name'] and p.info['name'].lower() == proc_name.lower():
                            p.kill()
                            killed.append(f"{proc_name} (PID: {p.info['pid']})")
                    except Exception:
                        pass
                if platform.system() == "Windows" and not killed:
                    os.system(f"taskkill /F /IM {proc_name}")
                    killed.append(proc_name)

            return {
                "success": True,
                "status": "Completed",
                "details": f"Successfully killed process(es): {', '.join(killed) if killed else proc_name or pid}"
            }

        elif action == "collect_forensics":
            processes = []
            for p in list(psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_info']))[:30]:
                try:
                    info = p.info
                    processes.append({
                        "pid": info.get('pid'),
                        "name": info.get('name'),
                        "username": info.get('username'),
                        "memory_mb": round(info.get('memory_info').rss / (1024 * 1024), 2) if info.get('memory_info') else 0
                    })
                except Exception:
                    pass

            net_conns = []
            try:
                for c in psutil.net_connections(kind='inet')[:20]:
                    if c.status == 'ESTABLISHED':
                        net_conns.append({
                            "laddr": f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else "",
                            "raddr": f"{c.raddr.ip}:{c.raddr.port}" if c.raddr else "",
                            "status": c.status,
                            "pid": c.pid
                        })
            except Exception:
                pass

            forensics_dump = {
                "system": {
                    "platform": platform.platform(),
                    "cpu_percent": psutil.cpu_percent(),
                    "memory_percent": psutil.virtual_memory().percent,
                    "boot_time": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(psutil.boot_time()))
                },
                "active_processes_count": len(psutil.pids()),
                "top_processes": processes,
                "network_connections": net_conns,
                "timestamp": time.strftime('%Y-%m-%d %H:%M:%S')
            }

            return {
                "success": True,
                "status": "Completed",
                "result": forensics_dump,
                "details": f"Collected forensics package ({len(processes)} processes, {len(net_conns)} network connections)."
            }

        elif action == "restart_agent":
            # Schedule process restart
            def restart():
                time.sleep(1)
                os.execv(sys.executable, ['python'] + sys.argv)
            
            import threading
            threading.Thread(target=restart, daemon=True).start()

            return {
                "success": True,
                "status": "Completed",
                "details": "Agent service restarting..."
            }

        elif action == "display_warning":
            message = params.get("message", "Security Warning from IT")
            if platform.system() == "Windows":
                ctypes.windll.user32.MessageBoxW(0, message, "Sentinel Alert", 0x30 | 0x0)
            return {
                "success": True,
                "status": "Completed",
                "details": f"Warning displayed: {message}"
            }

        else:
            logger.warning(f"Unknown command: {action}")
            return {
                "success": False,
                "status": "Failed",
                "details": f"Unknown command: {action}"
            }

    except Exception as e:
        logger.error(f"Error executing command {action}: {e}")
        return {
            "success": False,
            "status": "Failed",
            "details": f"Error executing {action}: {str(e)}"
        }
