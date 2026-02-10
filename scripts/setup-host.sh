#!/bin/bash
# Prepares the VPS for Salve Mundi 2.0 deployment

# Create deploy user if it doesn't exist
if ! id "deploy" &>/dev/null; then
    echo "Creating deploy user..."
    sudo useradd -m -s /bin/bash deploy
    sudo usermod -aG docker deploy
else
    echo "User deploy already exists."
fi

# Create deployment directories
echo "Creating deployment directories..."
sudo mkdir -p /opt/salvemundi/prod
sudo mkdir -p /opt/salvemundi/dev

# Set permissions and ownership
echo "Setting permissions and ownership..."
sudo chown -R deploy:docker /opt/salvemundi
sudo chmod -R 770 /opt/salvemundi

# Create placeholder .env files with restricted permissions
echo "Creating placeholder .env files..."
sudo touch /opt/salvemundi/prod/.env
sudo touch /opt/salvemundi/dev/.env
sudo chmod 600 /opt/salvemundi/prod/.env
sudo chmod 600 /opt/salvemundi/dev/.env
sudo chown deploy:docker /opt/salvemundi/prod/.env
sudo chown deploy:docker /opt/salvemundi/dev/.env

echo "Host setup complete."
