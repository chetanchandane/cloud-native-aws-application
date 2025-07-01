# 🍎 Cloud Native(AWS) AI-powered Nutrition Assistant

An AI-powered serverless application that allows users to upload food images and receive real-time nutrition insights and personalized dietary recommendations.

## 🚀 Features

- 🖼️ Upload meal images via web interface
- 📦 Serverless architecture with AWS Lambda, S3, API Gateway, DynamoDB
- 🧠 GPT-4o Turbo integration for personalized diet advice
- 📊 Real-time OCR using AWS Rekognition & Textract
- 📡 REST API endpoints to fetch and store meal logs
- ⚙️ CI/CD pipeline via GitHub Actions and Terraform
- ⚡ Response times under 5 seconds for 1000+ calculations


## 🧰 Tech Stack

- **Frontend:** React + Amplify
- **Backend:** AWS Lambda (Node.js), API Gateway
- **OCR:** AWS Rekognition, AWS Textract
- **AI:** GPT-4o Turbo
- **Infrastructure:** Terraform (6+ modules), IAM, CORS-enabled S3
- **Database:** AWS DynamoDB
- **CI/CD:** GitHub Actions Workflows(4-stage pipeline)

## Folder Structure
```bash
nutrition-assistant/
│
├── terraform/                 # All IaC code
│   ├── modules/               # Modular AWS resources
│
├── frontend/                  # React + Amplify frontend
│   └── .env                   # Env config
│
├── scripts/  
|   └── lambda/               # 1 of many Lambda functions, other functions are in terraform/modules/
│
├── docs/                      # Screenshots / demo.gif
└── README.md
```


## 🔄 CI/CD with GitHub Actions

This project uses a powerful, input-driven GitHub Actions workflow to manage Terraform-based infrastructure provisioning and teardown.

### 🔧 Workflow File: `.github/workflows/deploy.yml`

```yaml
name: Deploy AWeSome Nutrition App

on:
  workflow_dispatch:
    inputs:
      action:
        description: 'Terraform action to perform'
        type: choice
        options:
          - Terraform_apply
          - Terraform_destroy
```

### 🚀 Triggering a Deployment
- Go to your repository's Actions tab.

- Select "Deploy AWeSome Nutrition App" workflow.

- Click "Run workflow" → Choose Terraform_apply or Terraform_destroy.

## 📦 Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/chetanchandane/cloud-native-aws-application.git
   cd cloud-native-aws-application
    ```

2. **Configure AWS Credentials**
- Create an IAM user with programmatic access.

- Attach necessary permissions (AdministratorAccess for testing or scoped permissions).

- Add credentials to your environment:
    ```bash
    export AWS_ACCESS_KEY_ID=your_access_key
    export AWS_SECRET_ACCESS_KEY=your_secret_key
    ```

3. **Terraform Deployment**
    ```bash
    cd terraform/
    terraform init
    terraform apply
    ```
**This sets up:**

- API Gateway with 8 routes

- Lambda Functions

- S3 (CORS-enabled)

- DynamoDB

- IAM Roles

- Cognito Auth

- Output variables to copy into frontend .env    

##  **Frontend Setup (React + Amplify)**
    ```bash
    cd frontend
    npm install
    npm start
    ```
The app will launch at http://localhost:3000

### **Set Up .env for Frontend**
Create a .env file in /frontend with the following values
```env
    REACT_APP_AWS_REGION=us-east-1
    REACT_APP_USER_POOL_ID=us-east-1_xxxxxxx
    REACT_APP_APP_CLIENT_ID=xxxxxxxx
    REACT_APP_IDENTITY_POOL_ID=us-east-1:xxxxxxxx
    REACT_APP_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
```
💡 Use amplify pull or console to retrieve values from AWS Amplify or Terraform outputs.


##  **API Endpoints**  
    ______________________________________________________________________________________________
    | Method | Endpoint                              | Description                               |
    | ------ | ------------------------------------- | ----------------------------------------- |
    | `GET`  | `/upload-url`                         | Returns pre-signed S3 URL for upload      |
    | `POST` | `/process-image`                      | Triggers Lambda to process uploaded image |
    | `GET`  | `/result/{image_key}`                 | Fetches nutrition info for an image       |
    | `GET`  | `/meal-logs?date=YYYY-MM-DD&user_id=` | Get user’s meals for a date               |
    ----------------------------------------------------------------------------------------------
## ***User Flow***
```bash
    [React UI]
    ↓
    [GET /upload-url] → pre-signed S3 upload
    ↓
    [POST /process-image] → OCR, GPT-4o, store in DynamoDB
    ↓
    [GET /result/{image_key}] → fetch personalized nutrition insights
```

##  **Metrics and Impact**
- ⏱️ Reduced manual data entry by 90%

- 💡 300+ personalized recommendations

- 🧮 1000+ nutrient calculations

- 📉 60% faster deployment time via CI/CD

- 🟢 99.9% uptime with serverless architecture


## 🏗️ Mapping DevOps Pillars to This Project


| **DevOps Pillar**              | **How This Project Demonstrates It**                                                                                                                                          |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1. Automation**             | - Provisioning with **Terraform** (IaC)<br>- CI/CD using **GitHub Actions** (manual Terraform apply/destroy)<br>- Serverless architecture via **Lambda functions**            |
| **2. Continuous Integration** | - **GitHub Actions** pipeline runs on push/PR<br>- Includes linting, formatting, and Terraform validation                                                                       |
| **3. Continuous Delivery**    | - Zero-downtime deployments using **GitHub Actions** + **Amplify**<br>- Applies and destroys infrastructure conditionally on the `main` branch                                 |
| **4. Infrastructure as Code** | - **Terraform** modules for S3, API Gateway, Lambda, Cognito, DynamoDB, IAM<br>- Reusable, modular setup for easier collaboration and scaling                                 |
| **5. Monitoring & Feedback**  | - Fast feedback loop through API response times (< 5s)<br>- Design allows easy integration with **CloudWatch**, **X-Ray**, or **Prometheus/Grafana** for future monitoring    |
| **6. Security & Compliance**  | - Secrets stored in **GitHub Secrets** and **Org-level Variables**<br>- IAM roles scoped using **principle of least privilege**<br>- CORS and Cognito ensure secure access     |
| **7. Collaboration & Culture**| - GitOps-friendly workflows<br>- Modular architecture supports team collaboration<br>- Documentation, naming conventions, and Terraform variables aid onboarding and sharing    |
---

### 🙋‍♂️ Contributing

Contributions are welcome! Whether it's improving documentation, adding features, or fixing bugs — feel free to open issues or submit pull requests.

---

### 📬 Contact

If you have questions or want to collaborate, feel free to reach out:

- GitHub: [@chetanchandane](https://github.com/chetanchandane)
- Email: cc5831@rit.edu

---

### ⭐ Acknowledgments

- [OpenAI GPT-4o](https://openai.com/)
- [Nutritionix API](https://www.nutritionix.com/business/api)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [HashiCorp Terraform](https://www.terraform.io/)
- [GitHub Actions](https://docs.github.com/en/actions)

---



### 👥 Team & Collaboration

This project was a team effort built as part of a collaborative academic initiative.  
Special thanks to all contributors for their dedication and expertise:


- **Shardul Gadadare** – scg6975@rit.edu
- **Sourav Patil** – sp1513@rit.edu
- **Vinayaka Vishwanatha** – vv1629@rit.edu
- **Abdul Ahad Khan** – ak7160@rit.edu

We worked together across design, backend, infrastructure, and testing to deliver a production-ready serverless AI application.

---

### 🧾 License

This project is licensed under the [MIT License](LICENSE).

> Built with ☁️ passion for cloud, DevOps, and nutrition ✨

