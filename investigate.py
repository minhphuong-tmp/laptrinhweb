import sys
import traceback

def main():
    url = "https://ktdbcl.actvn.edu.vn/khao-thi/hvsv/xem-diem-thi.html"
    print(f"Attempting to fetch {url}...")

    html = None

    # Try requests first
    try:
        import requests
        print("Using requests library...")
        response = requests.get(url, verify=False, timeout=10)
        html = response.text
        print(f"Requests successful. Status: {response.status_code}")
    except ImportError:
        print("Requests library not found.")
    except Exception as e:
        print(f"Requests failed: {e}")

    # Fallback to urllib
    if not html:
        try:
            print("Using urllib library...")
            import urllib.request
            import ssl
            
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
                html = response.read().decode('utf-8', errors='ignore')
                print("Urllib successful.")
        except Exception as e:
            print(f"Urllib failed: {e}")
            traceback.print_exc()

    if not html:
        print("Could not fetch page.")
        return

    import re
    print(f"Content length: {len(html)}")
    
    # Analyze forms
    forms = re.findall(r'<form.*?>.*?</form>', html, re.DOTALL | re.IGNORECASE)
    print(f"Found {len(forms)} forms.")
    
    for i, form in enumerate(forms):
        print(f"\n--- Form {i+1} ---")
        action = re.search(r'action=["\'](.*?)["\']', form, re.IGNORECASE)
        method = re.search(r'method=["\'](.*?)["\']', form, re.IGNORECASE)
        print(f"Action: {action.group(1) if action else 'None'}")
        print(f"Method: {method.group(1) if method else 'None'}")
        
        inputs = re.findall(r'<input[^>]*>', form, re.IGNORECASE)
        print(f"Inputs ({len(inputs)}):")
        for inp in inputs:
            name = re.search(r'name=["\'](.*?)["\']', inp, re.IGNORECASE)
            id_attr = re.search(r'id=["\'](.*?)["\']', inp, re.IGNORECASE)
            type_attr = re.search(r'type=["\'](.*?)["\']', inp, re.IGNORECASE)
            print(f"  - Name: {name.group(1) if name else 'None'}, ID: {id_attr.group(1) if id_attr else 'None'}, Type: {type_attr.group(1) if type_attr else 'None'}")

if __name__ == "__main__":
    main()
