import platform
import psutil
import socket
import uuid
import os
import wmi

def get_device_info():
    info = {
        "hostname": socket.gethostname(),
        "os_version": f"{platform.system()} {platform.release()} ({platform.version()})",
        "device_id": str(uuid.UUID(int=uuid.getnode())),
        "ip_address": socket.gethostbyname(socket.gethostname()),
        "mac_address": ':'.join(['{:02x}'.format((uuid.getnode() >> ele) & 0xff) for ele in range(0,8*6,8)][::-1]),
        "cpu": platform.processor(),
        "ram": f"{round(psutil.virtual_memory().total / (1024.0 **3))} GB",
        "antivirus_status": "Unknown",
        "firewall_status": "Unknown",
        "agent_version": "1.0.0"
    }
    
    try:
        # Require wmi to check Windows Security Center
        c = wmi.WMI(namespace="root\\SecurityCenter2")
        
        av_products = c.AntivirusProduct()
        if av_products:
            info["antivirus_status"] = "Active"
            
        fw_products = c.FirewallProduct()
        if fw_products:
            info["firewall_status"] = "Enabled"
    except Exception:
        pass
        
    return info
