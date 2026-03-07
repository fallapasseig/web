import os
import urllib.request
import ssl

ssl._create_default_https_context = ssl._create_unverified_context
import time

out_dir = "src/assets/images/ods"
os.makedirs(out_dir, exist_ok=True)

for i in range(1, 18):
    goal_id = str(i).zfill(2)
    url = f"https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-{goal_id}.jpg"
    out_path = os.path.join(out_dir, f"ods-{goal_id}.jpg")
    try:
        print(f"Downloading {url}...")
        req = urllib.request.Request(
            url, 
            data=None, 
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0'
            }
        )
        response = urllib.request.urlopen(req, timeout=10)
        with open(out_path, 'wb') as f:
            f.write(response.read())
        print(f"Saved {out_path}.")
        time.sleep(1)
    except Exception as e:
        print(f"Failed to download {goal_id}: {e}")

print("Done.")

