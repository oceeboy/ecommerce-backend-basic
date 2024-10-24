import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  /**
   * Sign up a new user
   * Checks if the user already exists to avoid duplicates
   */
  async signup(signupDto: SignupDto): Promise<any> {
    const { username, email, password } = signupDto;
    const userExists = await this.userModel.findOne({ email });

    if (userExists) {
      throw new BadRequestException('Invalid signup details');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      username,
      email,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = this.createToken(user._id.toString(), user.username);

    // Save refresh token in the database
    user.refreshToken = tokens.refresh_token;
    await user.save();

    return tokens;
  }

  /**
   * Login an existing user
   * Throws an exception if the user is not found or credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.createToken(user._id.toString(), user.username);

    // Update user's refresh token in the database
    user.refreshToken = tokens.refresh_token;
    await user.save();

    return tokens;
  }

  /**
   * Refresh the access token using the refresh token
   * Throws an exception if the refresh token is invalid or expired
   */
  async refreshToken(refreshToken: string): Promise<any> {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken);

      // Find the user by decoded user ID (sub)
      const user = await this.userModel.findById(decoded.sub);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const newAccessToken = this.jwtService.sign(
        { sub: user._id.toString(), username: user.username },
        { expiresIn: '15m' }, // New short-lived access token
      );

      return {
        access_token: newAccessToken,
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Refresh token has expired');
      } else if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid refresh token');
      } else {
        throw new UnauthorizedException(
          'Something went wrong with token validation',
        );
      }
    }
  }

  /**
   * Helper method to create both access and refresh tokens
   */
  private createToken(userId: string, username: string) {
    const payload = { sub: userId, username };

    // Generate short-lived access token (e.g., 15 minutes)
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Generate long-lived refresh token (e.g., 7 days)
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Fetch all users (for testing purposes)
   * Comment out for production as it's only for testing
   */
  async getAllUsers(): Promise<User[]> {
    return this.userModel.find({}, { password: 0 }); // Exclude passwords
  }
}
