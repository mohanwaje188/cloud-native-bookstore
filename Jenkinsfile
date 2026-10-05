pipeline {
  agent any
  environment {
    ACCOUNT_ID = '531640467411'
    REGION     = 'ap-south-1'
    REGISTRY   = "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Install & Test') {
      steps { dir('backend') { sh 'npm install' ; sh 'npm test' } }
    }
    stage('Docker Build') {
      steps {
        sh 'docker build -t bookstore-backend:${BUILD_NUMBER} backend'
        sh 'docker build -t bookstore-frontend:${BUILD_NUMBER} frontend'
      }
    }
    stage('Push to ECR') {
      steps {
        withCredentials([string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                         string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')]) {
          sh '''
            aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $REGISTRY
            for app in backend frontend; do
              docker tag bookstore-$app:${BUILD_NUMBER} $REGISTRY/bookstore-$app:${BUILD_NUMBER}
              docker tag bookstore-$app:${BUILD_NUMBER} $REGISTRY/bookstore-$app:latest
              docker push $REGISTRY/bookstore-$app:${BUILD_NUMBER}
              docker push $REGISTRY/bookstore-$app:latest
            done
          '''
        }
      }
    }
  }
}