pipeline {
    agent any
    stages {
        stage('checkout') {
            steps { checkout scm }
        }
        stage('Install & Test') {
            steps { dir('backend') { sh 'npm install' ; sh 'npm test'}}
        }
        stage('Docker Build') {
            steps {
                sh 'docker build -t  bookstore-backend:${BUILD_NUMBER}  backend'
                sh 'docker build -t bookstore-frontend:${BUILD_NUMBER}  frontend'
            
            }
        }
        }
}