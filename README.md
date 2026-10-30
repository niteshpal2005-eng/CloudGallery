# CloudGallery

A cloud-based image storage and management system. Upload, view and delete images from a web gallery. Images are stored in AWS S3, served by a Node.js backend running in Docker on AWS EC2.

**Author:** Nitesh Kumar

## Architecture

```
Browser (HTML/CSS/JS)
        |
        |  HTTP (port 80)
        v
AWS EC2 (Amazon Linux 2023)
  └── Docker container: Node.js + Express backend
        |
        |  IAM Role (temporary credentials, no access keys)
        v
AWS S3 bucket (image storage)
```

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (fetch, async/await, FormData)
- **Backend:** Node.js, Express, Multer
- **Storage:** AWS S3
- **Security:** AWS IAM (least-privilege policy and an IAM Role)
- **Containers:** Docker
- **Hosting:** AWS EC2
- **Version control:** Git and GitHub

## Features

- Upload one or many images, with thumbnail previews and a remove button for each
- Gallery with a full-screen lightbox (close with ✕, the backdrop or Escape)
- Delete images from the gallery
- Clear error messages shown in the page (wrong file type, file too large)
- Upload button is disabled while uploading, to prevent double uploads

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/images` | Upload an image (form field: `image`) |
| GET | `/api/images` | List all images |
| DELETE | `/api/images/:filename` | Delete an image |

## Security

- **Least privilege:** the backend can only list, upload and delete objects in the `cloudgallery-images` bucket (`s3:ListBucket`, `s3:PutObject`, `s3:DeleteObject`). It does not use `AmazonS3FullAccess`.
- **IAM Role on EC2:** the server gets temporary credentials from an IAM Role, so no access keys exist on it.
- **Secrets stay out of Git and Docker:** `.env` is listed in `.gitignore` and `.dockerignore`.
- **Public read is limited:** the bucket policy allows `s3:GetObject` only, so images can be viewed but not listed or changed by the public.
- **Firewall:** the security group allows SSH only from one IP address and HTTP from the internet.
- **Upload checks:** only PNG, JPG, GIF and WEBP files are accepted, with a 5 MB size limit. The browser checks first, and the server checks again.

## Run Locally

1. Install Node.js and Docker Desktop.
2. Create `backend/.env` with these four variables (never commit this file):

```
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

3. Start the backend:

```
cd backend
npm install
node server.js
```

4. Open `frontend/index.html` with a local server such as VS Code Live Server.
5. In `frontend/script.js`, set `API_URL` to `http://localhost:5000/api/images`.

### Run with Docker

```
docker build -t cloudgallery-backend ./backend
docker run -d -p 5000:5000 --env-file backend/.env --name cloudgallery cloudgallery-backend
```

## Deployment (AWS EC2)

1. Create an IAM policy with the three S3 actions on the bucket, and an IAM Role for EC2 that uses it.
2. Launch an EC2 instance with that role attached. Open port 80 to the internet and SSH to your own IP only.
3. Install Docker and Git, then clone this repository.
4. Build and run the container, without any access keys:

```
docker build -t cloudgallery-backend ./backend
docker run -d -p 80:5000 -e AWS_REGION=us-east-1 -e S3_BUCKET_NAME=your-bucket-name --restart unless-stopped --name cloudgallery cloudgallery-backend
```

## Known Limitations

- The app uses HTTP only, not HTTPS.
- CORS is open to all origins.
- Original filenames are used in S3 keys, with no sanitising.
- File type is checked by MIME type, which a determined user could fake.
- The frontend runs from a local server and is not hosted in the cloud.
- The EC2 public IP changes if the instance is stopped and started (no Elastic IP).

## Project Progress

- Day 1: Environment setup and project structure
- Day 2: Frontend gallery UI
- Day 3: Express backend with upload, list and delete
- Day 4: Frontend connected to backend
- Day 5: AWS S3 integration
- Day 6: IAM least-privilege security
- Day 7: Dockerized backend
- Day 8: EC2 deployment with an IAM Role
- Day 9: Full cloud integration test
- Day 10: Upload type and size limits
- Day 11: Error messages and upload feedback
- Day 12: README and documentation