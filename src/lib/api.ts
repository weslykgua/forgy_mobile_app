const url = 'http://localhost:3000'

export const createUser = async (email: string, password: string, name: string) => {
    try {
        const response = await fetch(`${url}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}