pipeline {
    agent any

    stages {

        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Docker Version') {
            steps {
                sh 'docker --version'
                sh 'docker compose version'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'cd car-rental && docker compose build'
            }
        }

        stage('Run Containers') {
            steps {
                sh 'cd car-rental && docker compose up -d'
            }
        }

        stage('Verify Containers') {
            steps {
                sh 'docker ps'
            }
        }
    }
}
