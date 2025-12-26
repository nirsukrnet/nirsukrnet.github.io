py -m http.server 8080 --bind 127.0.0.1
c:\Python\AuTr\venv\Scripts\python.exe  -m http.server 8080 --bind 127.0.0.1
c:\Python\AuTr\venv\Scripts\python.exe -m http.server 8080 -b localhost --directory c:\Python\AuTr\html



git remote add origin https://github.com/nirsukrnet/voicestorage.git

https://nirsukrnet.github.io/voicestorage/mp3.html


# GIT

# PS C:\Python\AuTr\html> git branch                   
  main
* main202512

# PS C:\Python\AuTr\html> git push -u origin main202512
Enumerating objects: 24, done.
Counting objects: 100% (24/24), done.



git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com-nirsukrnet:nirsukrnet/voicestorage.git
git remote set-url origin git@github.com-nirsukrnet:nirsukrnet/voicestorage.git
git push -u origin main


git remote remove origin
git remote add origin git@github.com-nirsukrnet:nirsukrnet/nirsukrnet.github.io.git
git remote set-url origin git@github.com-nirsukrnet:nirsukrnet/nirsukrnet.github.io.git



powershell:
git --version
ssh -V

2.
Create (or reuse) SSH key for GitHub account (nirslife)

# Option: create directly in user profile (recommended)
ssh-keygen -t ed25519 -C "nirs@ukr.net" -f "$env:USERPROFILE\.ssh\id_ed25519_nirsukrnet"


3.
Start ssh-agent and add the key

# (Run VS Code or PowerShell as Administrator for the Set-Service line; else skip it)
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
ssh-add "$env:USERPROFILE\.ssh\id_ed25519_nirsukrnet"

# Verify key loaded
ssh-add -l

4.
Add the public key to GitHub (Account: nirslife)

Get-Content "$env:USERPROFILE\.ssh\id_ed25519_nirsukrnet.pub" | Set-Clipboard
start https://github.com/settings/keys

5.
Configure SSH host alias github.com-nirslife

File: $env:USERPROFILE\.ssh\config
--------------------------------
Host github.com-nirslife
  HostName github.com
  User git
  IdentityFile C:\Users\IvanNechvoloda\.ssh\id_ed25519_nirsukrnet
  IdentitiesOnly yes
--------------------------------

6.
Test the SSH connection

ssh -T git@github.com-nirsukrnet
# On first prompt: type yes (not no)
# Expected: "Hi nirslife! You've successfully authenticated, but GitHub does not provide shell access."

If you see host prompt again and want to pre-add:
ssh-keyscan github.com >> $env:USERPROFILE\.ssh\known_hosts

If you get "Permission denied (publickey)":
ssh-add "$env:USERPROFILE\.ssh\id_ed25519_nirslife"

7.
Clone the repository into C:\Python

cd C:\Python
git clone git@github.com-nirslife:nirslife/audio_transcription.git
code .\audio_transcription

Tip:
- Keep keys only in %USERPROFILE%\.ssh
- Do not commit keys; .ssh folder in project not needed.